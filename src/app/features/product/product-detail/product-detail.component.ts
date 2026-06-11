import { Component, inject, signal, computed, OnInit, input, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { KeyValuePipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { AuthStore } from '../../../store/auth.store';
import { Product, Review } from '../../../core/models';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PriceComponent, IconComponent, ButtonComponent, TextareaComponent, SkeletonComponent, KeyValuePipe, DatePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  readonly productIdInput = input<string | null>(null, { alias: 'productId' });

  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);

  loading = signal<boolean>(true);
  product = signal<Product | null>(null);
  activeImage = signal<string>('');
  quantity = signal<number>(1);
  activeTab = signal<'details' | 'reviews'>('details');
  reviews = signal<Review[]>([]);

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
        this.loadProduct(id);
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && !this.productIdInput()) {
        this.loadProduct(id);
      }
    });
  }

  async loadProduct(id: string) {
    this.loading.set(true);
    try {
      const prod = await this.apiService.getProductById(id);
      if (prod) {
        this.product.set(prod);
        this.activeImage.set(prod.images[0]);
        this.quantity.set(1);
        const revs = await this.apiService.getReviewsByProductId(id);
        this.reviews.set(revs);
      } else {
        this.product.set(null);
      }
    } catch (err) {
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  setActiveImage(img: string) {
    this.activeImage.set(img);
  }

  setActiveTab(tab: 'details' | 'reviews') {
    this.activeTab.set(tab);
  }

  incrementQty() {
    const stock = this.product()?.stock || 0;
    if (this.quantity() < stock) {
      this.quantity.update(q => q + 1);
    }
  }

  decrementQty() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart() {
    const prod = this.product();
    if (prod) {
      this.cartStore.addItem(prod, this.quantity());
    }
  }

  toggleWishlist() {
    const prod = this.product();
    if (prod) {
      this.userStore.toggleWishlist(prod);
    }
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

    const newReview: Review = {
      id: '',
      productId: prodId,
      userName: this.authStore.currentUser()?.name || 'Anonymous',
      rating: this.reviewRating(),
      comment: this.commentControl.value || '',
      date: new Date().toISOString()
    };

    try {
      await this.apiService.addReview(newReview);
      
      // refresh reviews
      const updatedRevs = await this.apiService.getReviewsByProductId(prodId);
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
    }
  }
}
