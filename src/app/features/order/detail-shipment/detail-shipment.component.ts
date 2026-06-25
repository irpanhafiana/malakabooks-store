import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderApiService } from '../../../core/services/order-api.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detail-shipment',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, SkeletonComponent, DatePipe],
  template: `
    <div class="animate-fade-in px-4 py-4 overflow-y-auto h-full no-scrollbar flex flex-col gap-6">
      
      <!-- Loading Skeleton State -->
      <ng-container *ngIf="loading()">
        <div class="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col gap-4">
          <app-skeleton type="table-row" [count]="2"></app-skeleton>
        </div>
        <div class="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col gap-6">
          <div class="h-5 w-32 bg-slate-100 rounded animate-pulse"></div>
          <div class="flex flex-col gap-4">
            <app-skeleton type="text" [count]="3"></app-skeleton>
          </div>
        </div>
      </ng-container>

      <!-- Error State -->
      <ng-container *ngIf="!loading() && error()">
        <div class="bg-white border border-slate-100 p-6 rounded-3xl text-center pb-8 flex flex-col items-center justify-center gap-4">
          <div class="h-14 w-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100">
            <app-icon name="error-circle" size="28"></app-icon>
          </div>
          <div>
            <h3 class="font-display font-extrabold text-slate-800 text-lg mb-1">Gagal Memuat Tracking</h3>
            <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{{ error() }}</p>
          </div>
          <button 
            (click)="retry()"
            class="px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:scale-95  cursor-pointer shadow-sm shadow-primary-200"
          >
            Coba Lagi
          </button>
        </div>
      </ng-container>

      <!-- Tracking Data State -->
      <ng-container *ngIf="!loading() && !error() && trackingData()">
        
        <!-- Summary Card -->
        <div class="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col gap-4 shadow-sm shadow-slate-50/50">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kurir Pengiriman</span>
              <strong class="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1">
                <i class="bx bx-truck text-slate-500 text-base"></i>
                {{ courier || 'Simasrim' }}
              </strong>
            </div>
            
            <span 
              [ngClass]="statusBadgeClass"
              class="px-3 py-1 text-[10px] font-bold rounded-full capitalize border"
            >
              {{ status || 'Diproses' }}
            </span>
          </div>

          <div class="flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-400">Nomor Resi / AWB</span>
              <div class="flex items-center gap-1.5">
                <strong class="font-bold text-slate-800 select-all">{{ awbNo }}</strong>
                <button 
                  (click)="copyToClipboard(awbNo)" 
                  class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50  cursor-pointer"
                  title="Salin Resi"
                >
                  <i class="bx bx-copy text-base"></i>
                </button>
              </div>
            </div>
            
            <div class="h-px bg-slate-100/70 w-full my-0.5"></div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-0.5">
                <span class="font-semibold text-slate-400">Pengirim</span>
                <span class="font-bold text-slate-700">{{ shipperName }}</span>
              </div>
              <div class="flex flex-col gap-0.5 text-right">
                <span class="font-semibold text-slate-400">Penerima</span>
                <span class="font-bold text-slate-700">{{ receiverName || 'Pelanggan' }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Detail Timeline Card -->
        <div class="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col gap-5 shadow-sm shadow-slate-50/50">
          <h3 class="font-display font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <i class="bx bx-list-ul text-slate-400 text-lg"></i> Status Pengiriman
          </h3>

          <!-- Timeline list -->
          <div *ngIf="trackingLogs.length > 0; else emptyTimeline" class="flex flex-col relative pl-6 border-l border-slate-100 ml-3 gap-6 py-1">
            
            <div 
              *ngFor="let log of trackingLogs; let i = index; let first = first; let last = last" 
              class="relative flex flex-col gap-1 text-xs"
            >
              <!-- Timeline node dot -->
              <div 
                [ngClass]="{
                  'bg-primary-500 border-4 border-primary-100 ring-2 ring-primary-50/50 ring-offset-0 animate-pulse': first,
                  'bg-slate-300 border-2 border-white': !first
                }"
                class="absolute -left-[30px] top-0.5 h-4.5 w-4.5 rounded-full flex items-center justify-center  "
              ></div>

              <!-- Log Date Time -->
              <span class="text-[10px] font-semibold text-slate-400">
                {{ getLogDate(log) | date: 'medium' }}
              </span>

              <!-- Log Description / Status -->
              <strong 
                [ngClass]="{ 'text-primary-700 font-extrabold': first, 'text-slate-800 font-bold': !first }"
                class="leading-snug"
              >
                {{ getLogDescription(log) }}
              </strong>

              <!-- Log Location / Detail Info -->
              <span *ngIf="getLogLocation(log)" class="text-slate-500 flex items-center gap-0.5 mt-0.5">
                <i class="bx bx-map text-slate-400 text-xs"></i>
                {{ getLogLocation(log) }}
              </span>
            </div>

          </div>

          <ng-template #emptyTimeline>
            <div class="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500 py-6 border border-dashed border-slate-200">
              <i class="bx bx-package text-slate-400 text-2xl mb-1.5 block"></i>
              Data perjalanan paket belum tersedia.<br>Silakan cek kembali secara berkala.
            </div>
          </ng-template>

        </div>

      </ng-container>

      <div class="flex flex-col gap-3">
        <a 
          routerLink="/order-history" 
          class="w-full text-center py-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 active:scale-98  block cursor-pointer"
        >
          Kembali ke Riwayat Pesanan
        </a>
      </div>

    </div>
  `
})
export class DetailShipmentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderApi = inject(OrderApiService);
  private readonly toastService = inject(ToastService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly trackingData = signal<any>(null);

  orderIdRouteParam = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
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
    } catch (err: any) {
      console.error('Gagal fetch tracking info:', err);
      this.error.set(err?.message || 'Gagal memuat status pengiriman dari server Simasrim. Silakan periksa koneksi Anda.');
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
  get trackingDetails(): any {
    const res = this.trackingData();
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
    if (!details) return 'MalakaBooks Store';
    return details.shipper_name || details.shipper || details.shipperName || 'MalakaBooks Store';
  }

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

  getLogDate(log: any): string {
    return log.date || log.dateTime || log.timestamp || log.time || '';
  }

  getLogDescription(log: any): string {
    return log.desc || log.description || log.status || log.note || '';
  }

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
        this.toastService.success('Nomor resi berhasil disalin!');
      }).catch(err => {
        console.error('Gagal menyalin resi:', err);
      });
    } else {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        this.toastService.success('Nomor resi berhasil disalin!');
      } catch (err) {
        console.error('Gagal menyalin resi (fallback):', err);
      }
      document.body.removeChild(input);
    }
  }
}
