import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../../../store/auth.store';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ExternalMessageService } from '../../../core/services/external-message.service';
import { LoggerService } from '../../../core/services/logger.service';
import Swal from 'sweetalert2';
import { ReviewApiService } from '../../../core/services/review-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, EmptyStateComponent, SkeletonComponent, StatusBadgeComponent, DatePipe, DecimalPipe, ButtonComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly externalMessageService = inject(ExternalMessageService);
  private readonly logger = inject(LoggerService);
  private readonly reviewApi = inject(ReviewApiService);
  private readonly toastService = inject(ToastService);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.orderStore.loadUserOrders(user.id);
  }

  checkPaymentStatus(orderId: string) {
    this.externalMessageService.postCheckPaymentDoku(orderId).subscribe({
      next: (response) => {
        this.logger.log('Status Pembayaran DOKU:', response);
        const user = this.authStore.currentUser();
        if (user) {
          this.orderStore.loadUserOrders(user.id);
        }
      },
      error: (err) => {
        this.logger.error('Gagal mengecek status pembayaran DOKU', err);
      }
    });
  }

  async openReviewDialog(event: Event, orderId: string, product: Product) {
    event.stopPropagation();
    event.preventDefault();

    const result = await Swal.fire({
      title: 'Tulis Ulasan',
      html: `
        <div class="flex flex-col gap-4 text-left">
          <div class="flex items-center gap-3">
            <img src="${product.coverImage}" class="w-12 h-16 object-cover rounded border border-slate-200">
            <span class="font-bold text-slate-800 line-clamp-2">${product.title}</span>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700">Penilaian Anda</label>
            <div id="swal-rating" class="flex items-center gap-2 text-3xl text-slate-300">
              <i class="bx bxs-star cursor-pointer hover:text-yellow-400 transition-colors" data-val="1"></i>
              <i class="bx bxs-star cursor-pointer hover:text-yellow-400 transition-colors" data-val="2"></i>
              <i class="bx bxs-star cursor-pointer hover:text-yellow-400 transition-colors" data-val="3"></i>
              <i class="bx bxs-star cursor-pointer hover:text-yellow-400 transition-colors" data-val="4"></i>
              <i class="bx bxs-star cursor-pointer hover:text-yellow-400 transition-colors" data-val="5"></i>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-slate-700">Komentar</label>
            <textarea id="swal-comment" class="w-full p-3 border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" rows="3" placeholder="Bagaimana pendapat Anda tentang buku ini?"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Kirim Ulasan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0ea5e9',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-semibold',
        cancelButton: 'rounded-xl font-semibold'
      },
      didOpen: () => {
        const ratingContainer = document.getElementById('swal-rating');
        let currentRating = 0;
        
        if (ratingContainer) {
          const stars = ratingContainer.querySelectorAll('i');
          stars.forEach(star => {
            star.addEventListener('click', (e) => {
              const val = parseInt((e.target as HTMLElement).getAttribute('data-val') || '0', 10);
              currentRating = val;
              // Update UI
              stars.forEach((s, idx) => {
                if (idx < val) {
                  s.classList.remove('text-slate-300');
                  s.classList.add('text-yellow-400');
                } else {
                  s.classList.add('text-slate-300');
                  s.classList.remove('text-yellow-400');
                }
              });
              // Simpan rating di atribut container untuk dibaca preConfirm
              ratingContainer.setAttribute('data-selected-rating', val.toString());
            });
          });
        }
      },
      preConfirm: () => {
        const ratingContainer = document.getElementById('swal-rating');
        const commentEl = document.getElementById('swal-comment') as HTMLTextAreaElement;
        
        const rating = parseInt(ratingContainer?.getAttribute('data-selected-rating') || '0', 10);
        const comment = commentEl?.value?.trim() || '';

        if (rating === 0) {
          Swal.showValidationMessage('Silakan berikan penilaian bintang (rating) terlebih dahulu');
          return false;
        }

        if (!comment) {
          Swal.showValidationMessage('Komentar tidak boleh kosong');
          return false;
        }

        return { rating, comment };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        Swal.fire({
          title: 'Mengirim...',
          text: 'Mohon tunggu sebentar',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await this.reviewApi.addReview({
          id: '',
          userId: '',
          bookId: product.id,
          orderId: orderId,
          rating: result.value.rating,
          comment: result.value.comment,
          additionalImages: [], // Could be expanded later to support image uploads
          createdAt: new Date().toISOString()
        }, orderId);

        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Ulasan Anda telah dikirim',
          confirmButtonColor: '#0ea5e9'
        });

      } catch (err: any) {
        let msg = 'Terjadi kesalahan saat mengirim ulasan.';
        if (err?.error?.message) {
          msg = err.error.message;
        } else if (err?.message) {
          msg = err.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: msg,
          confirmButtonColor: '#0ea5e9'
        });
      }
    }
  }
}
