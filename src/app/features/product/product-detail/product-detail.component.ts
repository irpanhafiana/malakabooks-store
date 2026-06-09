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
  template: `
    <div class="flex flex-col h-full overflow-hidden animate-fade-in">
      @if (loading()) {
        <div class="flex-grow overflow-y-auto px-5 py-4 flex flex-col gap-6">
          <app-skeleton type="card"></app-skeleton>
          <div class="flex flex-col gap-4">
            <app-skeleton type="text" height="32px" width="80%"></app-skeleton>
            <app-skeleton type="text" height="20px" width="40%"></app-skeleton>
            <app-skeleton type="text" height="60px" width="100%"></app-skeleton>
          </div>
        </div>
      } @else if (!product()) {
        <div class="flex-grow overflow-y-auto px-5 py-4 text-center py-16">
          <h2 class="text-xl font-display font-extrabold text-slate-800 mb-2">Product Not Found</h2>
          <p class="text-slate-500 text-xs mb-6">The product you are trying to view does not exist or has been removed.</p>
          <app-button routerLink="/product" variant="primary">Back to Shop</app-button>
        </div>
      } @else {
        <!-- Scrollable Details area -->
        <div class="flex-grow overflow-y-auto px-5 py-4 no-scrollbar">
          <!-- Breadcrumbs -->
          @if (!productIdInput()) {
            <nav class="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
              <a routerLink="/" class="hover:text-slate-600 transition-colors text-slate-400">Home</a>
              <app-icon name="chevron-right" size="12"></app-icon>
              <a routerLink="/product" class="hover:text-slate-600 transition-colors text-slate-400">Shop</a>
              <app-icon name="chevron-right" size="12"></app-icon>
              <span class="text-slate-600 truncate max-w-[200px]">{{ product()?.name }}</span>
            </nav>
          }

          <div class="flex flex-col gap-6">
            
            <!-- Image Gallery -->
            <div class="flex flex-col gap-4">
              <!-- Main Image Viewer -->
              <div class="aspect-square bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs relative">
                <img
                  [src]="activeImage()"
                  [alt]="product()!.name"
                  class="w-full h-full object-cover object-center"
                />
                @if (product()!.originalPrice && product()!.originalPrice! > product()!.price) {
                  <span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold bg-rose-500 text-white rounded-lg">
                    Save {{ Math.round(((product()!.originalPrice! - product()!.price)/product()!.originalPrice!) * 100) }}%
                  </span>
                }
              </div>

              <!-- Image Thumbnails -->
              @if (product()!.images.length > 1) {
                <div class="flex gap-3 overflow-x-auto no-scrollbar">
                  @for (img of product()!.images; track img) {
                    <button
                      type="button"
                      (click)="setActiveImage(img)"
                      [class.border-primary-500]="activeImage() === img"
                      [class.border-slate-100]="activeImage() !== img"
                      class="h-20 w-20 flex-shrink-0 bg-white border-2 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all"
                    >
                      <img [src]="img" class="w-full h-full object-cover" />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Product Details Column -->
            <div class="flex flex-col gap-5">
              <!-- Meta & Title -->
              <div class="flex items-start justify-between gap-4">
                <div class="flex-grow">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ product()!.categoryName }}</span>
                  <h1 class="text-xl font-display font-extrabold text-slate-800 tracking-tight mt-2.5 leading-snug">{{ product()!.name }}</h1>
                  <p class="text-xs text-slate-400 mt-1.5">Brand: <strong class="text-slate-600 font-semibold">{{ product()!.brand }}</strong></p>
                </div>
                <!-- Wishlist heart button next to title -->
                <button
                  type="button"
                  (click)="toggleWishlist()"
                  class="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-rose-500 transition-all cursor-pointer active:scale-90 h-10 w-10 flex items-center justify-center flex-shrink-0 aspect-square outline-none"
                >
                  <app-icon [name]="userStore.isWishlisted(product()!.id) ? 'heart-filled' : 'heart'" size="18" [class]="userStore.isWishlisted(product()!.id) ? 'text-rose-500' : 'text-slate-400'"></app-icon>
                </button>
              </div>

              <!-- Ratings -->
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-0.5 text-amber-400">
                  @for (star of [1,2,3,4,5]; track star) {
                    <app-icon name="star" size="14" [class]="star <= Math.round(product()!.rating) ? 'fill-amber-400' : 'text-slate-200'"></app-icon>
                  }
                </div>
                <span class="text-xs font-bold text-slate-700">{{ product()!.rating }}</span>
                <span class="text-xs text-slate-400">({{ product()!.reviewsCount }} reviews)</span>
              </div>

              <hr class="border-slate-100" />

              <!-- Price & Stock -->
              <div class="flex items-baseline gap-3">
                <app-price [value]="product()!.price" size="xl" class="text-primary-600"></app-price>
                @if (product()!.originalPrice) {
                  <span class="text-sm text-slate-400 line-through leading-none">$ {{ product()!.originalPrice }}</span>
                }
              </div>

              <div>
                <span class="text-xs font-semibold text-slate-500">Stock Availability:</span>
                @if (product()!.stock > 0) {
                  <span class="text-xs font-bold text-emerald-600 ml-1.5">{{ product()!.stock }} items left</span>
                } @else {
                  <span class="text-xs font-bold text-rose-500 ml-1.5">Out of Stock</span>
                }
              </div>
            </div>
          </div>

          <!-- Detail Information Tabs -->
          <div class="mt-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
            <!-- Tab Headers -->
            <div class="flex border-b border-slate-100 gap-6 mb-6">
              <button
                (click)="setActiveTab('details')"
                [class.text-primary-600]="activeTab() === 'details'"
                [class.border-primary-600]="activeTab() === 'details'"
                [class.text-slate-400]="activeTab() !== 'details'"
                class="pb-3 text-sm font-bold border-b-2 border-transparent transition-all cursor-pointer"
              >
                Description & Specs
              </button>
              <button
                (click)="setActiveTab('reviews')"
                [class.text-primary-600]="activeTab() === 'reviews'"
                [class.border-primary-600]="activeTab() === 'reviews'"
                [class.text-slate-400]="activeTab() !== 'reviews'"
                class="pb-3 text-sm font-bold border-b-2 border-transparent transition-all cursor-pointer"
              >
                Reviews ({{ reviews().length }})
              </button>
            </div>

            <!-- Tab Content Views -->
            <div>
              @if (activeTab() === 'details') {
                <div class="flex flex-col gap-6 animate-fade-in">
                  <div>
                    <h3 class="font-display font-bold text-slate-800 text-sm mb-2">About the Product</h3>
                    <p class="text-sm text-slate-500 leading-relaxed font-sans">{{ product()!.description }}</p>
                  </div>
                  
                  @if (hasSpecs()) {
                    <div>
                      <h3 class="font-display font-bold text-slate-800 text-sm mb-3">Specifications</h3>
                      <div class="grid grid-cols-1 gap-x-8 gap-y-2 border border-slate-100 rounded-2xl overflow-hidden">
                        @for (spec of product()!.specifications | keyvalue; track spec.key) {
                          <div class="flex justify-between p-3 text-xs border-b border-slate-100 last:border-0">
                            <span class="text-slate-400 font-semibold uppercase tracking-wider">{{ spec.key }}</span>
                            <span class="text-slate-700 font-bold text-right">{{ spec.value }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              @if (activeTab() === 'reviews') {
                <div class="flex flex-col gap-8 animate-fade-in">
                  <!-- Review List -->
                  <div class="flex flex-col gap-4">
                    @if (reviews().length === 0) {
                      <p class="text-sm text-slate-400 text-center py-6">No reviews yet. Be the first to review this product!</p>
                    } @else {
                      @for (rev of reviews(); track rev.id) {
                        <div class="flex flex-col gap-2 p-4 border border-slate-50 rounded-2xl bg-slate-50/20">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-slate-800">{{ rev.userName }}</span>
                            <span class="text-[10px] text-slate-400">{{ rev.date | date: 'mediumDate' }}</span>
                          </div>
                          <div class="flex items-center text-amber-400 gap-0.5">
                            @for (star of [1,2,3,4,5]; track star) {
                              <app-icon name="star" size="10" [class]="star <= rev.rating ? 'fill-amber-400' : 'text-slate-200'"></app-icon>
                            }
                          </div>
                          <p class="text-xs text-slate-600 leading-relaxed">{{ rev.comment }}</p>
                        </div>
                      }
                    }
                  </div>

                  <hr class="border-slate-100" />

                  <!-- Add Review Form -->
                  <div>
                    <h3 class="font-display font-bold text-slate-800 text-sm mb-4">Write a Review</h3>
                    <form [formGroup]="reviewForm" (submit)="onSubmitReview()" class="flex flex-col gap-4 max-w-lg">
                      <!-- Rating Stars selector -->
                      <div class="flex flex-col gap-1.5">
                        <span class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Rating</span>
                        <div class="flex gap-1.5 items-center">
                          @for (star of [1,2,3,4,5]; track star) {
                            <button
                              type="button"
                              (click)="setReviewRating(star)"
                              class="text-slate-200 hover:text-amber-400 cursor-pointer transition-colors"
                            >
                              <app-icon
                                name="star"
                                size="24"
                                [class]="star <= reviewRating() ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                              ></app-icon>
                            </button>
                          }
                        </div>
                      </div>

                      <app-textarea
                        label="Review Comment"
                        placeholder="Write your thoughts and experience about this product..."
                        [control]="commentControl"
                        [rows]="4"
                      ></app-textarea>

                      <div class="flex">
                        <app-button
                          type="submit"
                          [disabled]="reviewForm.invalid"
                          variant="primary"
                          size="sm"
                        >
                          Submit Review
                        </app-button>
                      </div>
                    </form>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Action Bar -->
        <div class="shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-6 flex items-center justify-between gap-3">
          <!-- Total Price display -->
          <div class="flex flex-col shrink-0 min-w-[90px] text-left">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Price</span>
            <app-price [value]="product()!.price * quantity()" size="md" class="text-primary-600"></app-price>
          </div>

          <!-- Quantity selectors -->
          <div class="flex items-center border border-slate-200 bg-slate-50/30 rounded-xl overflow-hidden h-11 shrink-0">
            <button
              type="button"
              (click)="decrementQty()"
              [disabled]="quantity() <= 1"
              class="px-2.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
            >
              <app-icon name="minus" size="12"></app-icon>
            </button>
            <span class="w-8 text-center font-bold text-slate-800 text-xs select-none">{{ quantity() }}</span>
            <button
              type="button"
              (click)="incrementQty()"
              [disabled]="quantity() >= product()!.stock"
              class="px-2.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
            >
              <app-icon name="plus" size="12"></app-icon>
            </button>
          </div>

          <!-- Buy / Add to Cart button -->
          <div class="flex-grow">
            <app-button
              (click)="addToCart()"
              [disabled]="product()!.stock <= 0"
              variant="primary"
              class="h-11 shadow-md w-full text-xs font-bold"
            >
              <app-icon name="shopping-cart" size="16"></app-icon>
              Add to Cart
            </app-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
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
