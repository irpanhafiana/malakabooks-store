import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderApiService } from '../../../core/services/order-api.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AlertService } from '../../../core/services/alert.service';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detail-shipment',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, SkeletonComponent, DatePipe],
  templateUrl: './detail-shipment.component.html',
  styleUrl: './detail-shipment.component.css'
})
export class DetailShipmentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);
  private readonly alertService = inject(AlertService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly trackingData = signal<unknown>(null);

  orderIdRouteParam = '';

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.orderIdRouteParam = id;
        this.loadTracking(id);
      } else {
        this.error.set('ID pesanan tidak ditemukan dalam rute.');
        this.loading.set(false);
      }
    });
  }

  async loadTracking(orderId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.orderApi.trackAwb(orderId);
      if (response) {
        this.trackingData.set(response);
      } else {
        this.error.set('Data tracking kosong dari API server.');
      }
    } catch (err: unknown) {
      this.logger.error('Gagal fetch tracking info:', err);
      this.error.set((err as Error)?.message || 'Gagal memuat status pengiriman dari server Simasrim. Silakan periksa koneksi Anda.');
    } finally {
      this.loading.set(false);
    }
  }

  retry() {
    if (this.orderIdRouteParam) {
      this.loadTracking(this.orderIdRouteParam);
    }
  }

  // Helper to extract nested "data" if it exists in response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get trackingDetails(): any {
    const res = this.trackingData() as any;
    if (!res) return null;
    if (res.data) {
      return res.data;
    }
    return res;
  }

  // Robust Parsers for any API response wrapper
  get awbNo(): string {
    const details = this.trackingDetails;
    if (!details) return '-';
    return details.awb || details.Awb || details.awbNo || details.AWBNo || details.trackingNumber || '-';
  }

  get status(): string {
    const details = this.trackingDetails;
    if (!details) return '';
    const rawStatus = details.status || details.statusName || details.deliveryStatus || '';
    if (rawStatus && typeof rawStatus === 'object') {
      return rawStatus.name || rawStatus.status || '';
    }
    return rawStatus;
  }

  get courier(): string {
    const details = this.trackingDetails;
    if (!details) return '';
    return details.ekspedisi || details.courier || details.courierName || details.expedition || '';
  }

  get receiverName(): string {
    const details = this.trackingDetails;
    if (!details) return '';
    return details.receiver_name || details.receiver || details.receiverName || details.recipient || '';
  }

  get shipperName(): string {
    const details = this.trackingDetails;
    if (!details) return 'Kopi Mardika';
    return details.shipper_name || details.shipper || details.shipperName || 'Kopi Mardika';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get trackingLogs(): any[] {
    const details = this.trackingDetails;
    if (!details) return [];

    // Check if logs are wrapped under history_pengiriman or other keys
    const rawList = details.history_pengiriman || details.history || details.histories || details.logs || details.manifests || details.manifest || details.details || [];

    if (Array.isArray(rawList)) {
      // Sort logs by date descending (most recent first)
      return [...rawList].sort((a, b) => {
        const dateA = new Date(this.getLogDate(a)).getTime();
        const dateB = new Date(this.getLogDate(b)).getTime();
        return dateB - dateA;
      });
    }
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogDate(log: any): string {
    return log.date || log.dateTime || log.timestamp || log.time || '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogDescription(log: any): string {
    return log.desc || log.description || log.status || log.note || '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogLocation(log: any): string {
    return log.location || log.city || log.position || '';
  }

  get statusBadgeClass(): string {
    const s = (this.status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('terima') || s.includes('sukses')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (s.includes('transit') || s.includes('kirim') || s.includes('jalan') || s.includes('otw')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (s.includes('pickup') || s.includes('kurir') || s.includes('proses')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (s.includes('fail') || s.includes('gagal') || s.includes('retur') || s.includes('cancel')) {
      return 'bg-rose-50 text-rose-600 border-rose-100';
    }
    return 'bg-slate-50 text-slate-600 border-slate-100';
  }

  copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.alertService.success('Nomor resi berhasil disalin!');
      }).catch(err => {
        this.logger.error('Gagal menyalin resi:', err);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        this.alertService.success('Nomor resi berhasil disalin!');
      } catch (err) {
        this.logger.error('Gagal menyalin resi (fallback):', err);
      }
      document.body.removeChild(input);
    }
  }
}
