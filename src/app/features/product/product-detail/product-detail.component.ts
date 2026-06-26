import { Component, inject, signal, computed, OnInit, input, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { KeyValuePipe, DatePipe } from '@angular/common';
import { ProductApiService } from '../../../core/services/product-api.service';
import { ReviewApiService } from '../../../core/services/review-api.service';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { AuthStore } from '../../../store/auth.store';
import { ProductStore } from '../../../store/product.store';
import { Product, Review } from '../../../core/models';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';

import { DiscountBadgeComponent } from '../../../shared/ui/discount-badge/discount-badge.component';
import { QuantitySelectorComponent } from '../../../shared/ui/quantity-selector/quantity-selector.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink, 
    ReactiveFormsModule, 
    PriceComponent, 
    IconComponent, 
    ButtonComponent, 
    TextareaComponent, 
    SpinnerComponent, 

    DiscountBadgeComponent, 
    KeyValuePipe, 
    DatePipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  readonly productIdInput = input<string | null>(null, { alias: 'productId' });

  private readonly route = inject(ActivatedRoute);
  private readonly productApi = inject(ProductApiService);
  private readonly reviewApi = inject(ReviewApiService);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly productStore = inject(ProductStore);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal<boolean>(true);
  product = signal<Product | null>(null);
  activeImage = signal<string>('');
  activeTab = signal<'details' | 'reviews'>('details');
  reviews = signal<Review[]>([]);
  isSubmittingReview = signal<boolean>(false);

  // Review Form controls
  reviewRating = signal<number>(5);
  commentControl = new FormControl('', [Validators.required, Validators.minLength(5)]);

  reviewForm = new FormGroup({
    comment: this.commentControl
  });

  protected readonly Math = Math;

  constructor() {
    effect(() => {
      const id = this.productIdInput();
      if (id) {
        this.activeTab.set('details');
        this.loadProduct(id);
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id && !this.productIdInput()) {
        this.loadProduct(id);
      }
    });
  }

  async loadProduct(id: string) {
    this.loading.set(true);
    try {
      const [prod, revs] = await Promise.all([
        this.productApi.getProductById(id),
        this.reviewApi.getReviewsByProductId(id)
      ]);

      if (prod) {
        this.product.set(prod);
        this.productStore.setActiveProduct(prod);
        this.activeImage.set(prod.images[0]);
        this.reviews.set(revs || []);
      } else {
        this.product.set(null);
      }
    } catch (err) {
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  setActiveImage(img: string, scrollContainer?: HTMLElement) {
    this.activeImage.set(img);
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setActiveTab(tab: 'details' | 'reviews') {
    this.activeTab.set(tab);
  }

  openQuantityModal(event: Event) {
    event.stopPropagation();
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setReopenDetailOnQtyClose(true);
    this.productStore.setQtyModalOpen(true);
    this.productStore.setSelectedProductId(null);
  }

  buyNow(event: Event) {
    event.stopPropagation();
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('buy');
    this.productStore.setReopenDetailOnQtyClose(true);
    this.productStore.setQtyModalOpen(true);
    this.productStore.setSelectedProductId(null);
  }

  goToLogin(event: Event) {
    this.productStore.setSelectedProductId(null);
  }

  hasSpecs(): boolean {
    const specs = this.product()?.specifications;
    return specs ? Object.keys(specs).length > 0 : false;
  }

  setReviewRating(rating: number) {
    this.reviewRating.set(rating);
  }

  async onSubmitReview() {
    if (this.reviewForm.invalid) return;

    const prodId = this.product()?.id;
    if (!prodId) return;

    this.isSubmittingReview.set(true);

    const newReview: Review = {
      id: '',
      productId: prodId,
      userName: this.authStore.currentUser()?.name || 'Anonymous',
      rating: this.reviewRating(),
      comment: this.commentControl.value || '',
      date: new Date().toISOString()
    };

    try {
      await this.reviewApi.addReview(newReview);
      
      // refresh reviews
      const updatedRevs = await this.reviewApi.getReviewsByProductId(prodId);
      this.reviews.set(updatedRevs);
      
      // update product rating local display
      const prod = this.product();
      if (prod) {
        const total = updatedRevs.reduce((sum, r) => sum + r.rating, 0);
        prod.rating = parseFloat((total / updatedRevs.length).toFixed(1));
        prod.reviewsCount = updatedRevs.length;
        this.product.set({ ...prod });
      }

      this.toastService.success('Review submitted successfully!');
      this.reviewForm.reset();
      this.reviewRating.set(5);
    } catch (e) {
      this.toastService.error('Failed to submit review.');
    } finally {
      this.isSubmittingReview.set(false);
    }
  }
}
