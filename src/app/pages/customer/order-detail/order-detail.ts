import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../core/services/order.service';
import { AddressService } from '../../../core/services/address.service';
import { BookService } from '../../../core/services/book.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Order } from '../../../core/models/order.model';
import { Address } from '../../../core/models/address.model';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

import { ViewportService } from '../../../core/services/viewport.service';
import { OrderDetailDesktopComponent } from './order-detail-desktop';
import { OrderDetailMobileComponent } from './order-detail-mobile';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    OrderDetailDesktopComponent,
    OrderDetailMobileComponent
  ],
  templateUrl: './order-detail.html'
})
export class OrderDetailPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly addressService = inject(AddressService);
  private readonly bookService = inject(BookService);
  private readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  order = signal<Order | null>(null);
  address = signal<Address | null>(null);
  
  isLoading = signal(true);

  // Status mapping
  readonly timelineSteps = [
    { status: 'pending', label: 'Menunggu', description: 'Pesanan dibuat' },
    { status: 'processing', label: 'Diproses', description: 'Buku dikemas' },
    { status: 'shipped', label: 'Dikirim', description: 'Kurir membawa barang' },
    { status: 'delivered', label: 'Selesai', description: 'Barang diterima' }
  ];

  readonly orderSubtotal = computed(() => {
    const ord = this.order();
    if (!ord) return 0;
    return ord.items.reduce((total, item) => total + item.price * item.quantity, 0);
  });

  readonly orderShipping = computed(() => {
    const ord = this.order();
    if (!ord) return 0;
    return ord.totalPrice - this.orderSubtotal();
  });

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadOrderDetails(id);
        }
      });
  }

  loadOrderDetails(id: string) {
    this.isLoading.set(true);
    this.orderService.getById(id).subscribe((ord) => {
      if (ord) {
        this.order.set(ord);

        // Fetch Address
        this.addressService.getById(ord.addressId).subscribe((addr) => {
          this.address.set(addr || null);
        });

        this.isLoading.set(false);
      } else {
        this.order.set(null);
        this.isLoading.set(false);
      }
    });
  }

  onCancelOrder(id: string) {
    if (confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Restorasi stok buku akan dilakukan.')) {
      this.isLoading.set(true);
      this.orderService.updateStatus(id, 'cancelled').subscribe({
        next: () => {
          this.toastService.showSuccess('Pesanan berhasil dibatalkan secara aman.');
          this.loadOrderDetails(id);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toastService.showError(err.message || 'Gagal membatalkan pesanan.');
        }
      });
    }
  }

  getBookCover(bookId: string): string {
    const book = this.bookService.booksSignal().find((b) => b.id === bookId);
    return book ? book.coverImage : '';
  }

  isStepActive(orderStatus: Order['status'], stepStatus: string): boolean {
    const orderIndex = this.timelineSteps.findIndex((s) => s.status === orderStatus);
    const stepIndex = this.timelineSteps.findIndex((s) => s.status === stepStatus);
    return orderIndex >= stepIndex;
  }

  hasReviewed(bookId: string, orderId: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.reviewService.hasReviewed(user.id, bookId, orderId);
  }

  getStatusText(status: Order['status']): string {
    const mappings: Record<Order['status'], string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Selesai',
      cancelled: 'Batal'
    };
    return mappings[status] || status;
  }
}
