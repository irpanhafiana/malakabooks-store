import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../store/auth.store';
import { OrderStore } from '../../../store/order.store';
import { ScreenService } from '../../../core/services/screen.service';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { BottomSheetComponent } from '../../../shared/ui/bottom-sheet/bottom-sheet.component';
import { ExternalMessageService } from '../../../core/services/external-message.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ReviewApiService } from '../../../core/services/review-api.service';
import { AlertService } from '../../../core/services/alert.service';
import { Product } from '../../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, EmptyStateComponent, SkeletonComponent, StatusBadgeComponent, DatePipe, DecimalPipe, ButtonComponent, BottomSheetComponent, ModalComponent, FormsModule, NgTemplateOutlet],
  templateUrl: './order-history.component.html'
})
export class OrderHistoryComponent implements OnInit {
  protected readonly screen = inject(ScreenService);
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly externalMessageService = inject(ExternalMessageService);
  private readonly logger = inject(LoggerService);
  private readonly reviewApi = inject(ReviewApiService);
  private readonly alertService = inject(AlertService);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.orderStore.loadUserOrders(user.id);
  }

  async checkPaymentStatus(orderId: string) {
    try {
      const response = await this.externalMessageService.postCheckPaymentDoku(orderId);
      this.logger.log('Status Pembayaran DOKU:', response);
      const user = this.authStore.currentUser();
      if (user) {
        this.orderStore.loadUserOrders(user.id);
      }
    } catch (err) {
      this.logger.error('Gagal mengecek status pembayaran DOKU', err);
    }
  }

  isReviewSheetOpen = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);
  selectedOrderId = signal<string>('');
  reviewRating = signal<number>(0);
  reviewComment = signal<string>('');
  reviewImages = signal<{no: number, image: string}[]>([]);
  reviewImageFiles = signal<File[]>([]);
  isSubmittingReview = signal<boolean>(false);

  openReviewSheet(event: Event, orderId: string, product: Product) {
    event.stopPropagation();
    event.preventDefault();

    this.selectedOrderId.set(orderId);
    this.selectedProduct.set(product);
    this.reviewRating.set(0);
    this.reviewComment.set('');
    this.reviewImages.set([]);
    this.reviewImageFiles.set([]);
    this.isReviewSheetOpen.set(true);
  }

  closeReviewSheet() {
    this.isReviewSheetOpen.set(false);
  }

  updateComment(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.reviewComment.set(val);
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.reviewImageFiles.set([...this.reviewImageFiles(), file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const current = this.reviewImages();
        this.reviewImages.set([...current, { no: current.length + 1, image: base64 }]);
      };
      reader.readAsDataURL(file);
    }
    // reset input value so the same file can be selected again
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(index: number) {
    const current = this.reviewImages();
    this.reviewImages.set(current.filter((_, i) => i !== index));
    this.reviewImageFiles.set(this.reviewImageFiles().filter((_, i) => i !== index));
  }

  async submitReview() {
    const product = this.selectedProduct();
    const orderId = this.selectedOrderId();
    const rating = this.reviewRating();
    const comment = this.reviewComment().trim();

    if (!product || !orderId || rating === 0 || !comment) return;

    this.isSubmittingReview.set(true);

    try {
      await this.reviewApi.addReview({
        id: '',
        userId: '',
        itemId: product.id,
        orderId: orderId,
        rating: rating,
        comment: comment,
        additionalImages: this.reviewImages(),
        createdAt: new Date().toISOString()
      }, orderId, this.reviewImageFiles());

      this.closeReviewSheet();
      this.alertService.success('Ulasan Anda telah dikirim');
    } catch (err: unknown) {
      let msg = 'Terjadi kesalahan saat mengirim ulasan.';
      const e = err as { error?: { statusMessage?: string, message?: string }, message?: string };
      if (e?.error?.statusMessage) {
        msg = e.error.statusMessage;
      } else if (e?.error?.message) {
        msg = e.error.message;
      } else if (e?.message) {
        msg = e.message;
      }
      this.alertService.error(msg);
    } finally {
      this.isSubmittingReview.set(false);
    }
  }
}
