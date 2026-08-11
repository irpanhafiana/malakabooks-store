import { Component, inject, signal, OnInit, input, output, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, Location } from '@angular/common';
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
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mardika-kopi-detail',
  standalone: true,
  host: {
    class: 'flex flex-col flex-1 min-h-0 w-full overflow-hidden'
  },
  imports: [
    RouterLink,
    PriceComponent,
    IconComponent,
    ButtonComponent,
    SpinnerComponent,
    DatePipe
  ],
  templateUrl: './mardika-kopi-detail.component.html',
  styleUrl: './mardika-kopi-detail.component.css'
})
export class MardikaKopiDetailComponent implements OnInit {
  readonly productId = input<string | null>(null);
  readonly closed = output<void>();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productApi = inject(ProductApiService);
  private readonly reviewApi = inject(ReviewApiService);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly productStore = inject(ProductStore);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  loading = signal<boolean>(true);
  loadError = signal<string | null>(null);
  product = signal<Product | null>(null);
  activeImage = signal<string>('');
  activeTab = signal<'details' | 'reviews'>('details');
  reviews = signal<Review[]>([]);
  isWishlisted = signal<boolean>(false);
  protected readonly imageError = signal(false);
  protected readonly Math = Math;

  constructor() {
    effect(() => {
      const id = this.productId();
      if (id) {
        this.activeTab.set('details');
        this.fetchProductDetail(id);
      }
    });

    effect(() => {
      this.activeImage();
      this.imageError.set(false);
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id && !this.productId()) {
        this.fetchProductDetail(id);
      }
    });
  }

  getAllImages(): string[] {
    const prod = this.product();
    if (!prod) return [];
    const images: string[] = [];
    if (prod.coverImage) images.push(prod.coverImage);
    if (prod.additionalImages) {
      images.push(...prod.additionalImages.map(a => a.image));
    }
    return images;
  }

  private async fetchProductDetail(id: string) {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [prod, revs] = await Promise.all([
        this.productApi.getProductById(id),
        this.reviewApi.getReviewsByProductId(id)
      ]);

      if (prod) {
        this.product.set(prod);
        this.productStore.setActiveProduct(prod);
        this.activeImage.set(prod.coverImage);
        this.reviews.set(revs || []);
      } else {
        this.product.set(null);
      }
    } catch {
      this.product.set(null);
      this.loadError.set('Gagal memuat detail produk kopi. Silakan periksa koneksi Anda dan coba lagi.');
    } finally {
      this.loading.set(false);
    }
  }

  retryLoading() {
    const id = this.productId() || this.productStore.selectedProductId();
    if (id) {
      this.fetchProductDetail(id);
    }
  }

  setActiveImage(img: string, scrollContainer?: HTMLElement) {
    this.activeImage.set(img);

    if (scrollContainer) {
      const images = Array.from(scrollContainer.children) as HTMLElement[];
      const activeIdx = (this.product()?.additionalImages || []).findIndex(i => i.image === img) + 1;
      if (images[activeIdx]) {
        images[activeIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  setActiveTab(tab: 'details' | 'reviews') {
    this.activeTab.set(tab);
  }

  openQuantityModal(event: Event) {
    event.stopPropagation();
    if (!this.authStore.isLoggedIn()) {
      this.goToLogin();
      return;
    }
    if (this.product()!.stock <= 0) {
      this.alertService.confirm(
        'Stok Kosong',
        'Saat ini stok produk sedang kosong. Anda tetap bisa memasukkannya ke keranjang untuk di-checkout nanti. Lanjutkan?',
        'Ya, Lanjutkan'
      ).then((isConfirmed) => {
        if (isConfirmed) {
          this.executeOpenQtyModal('cart');
        }
      });
      return;
    }
    this.executeOpenQtyModal('cart');
  }

  private executeOpenQtyModal(action: 'cart' | 'buy') {
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction(action);
    this.productStore.setReopenDetailOnQtyClose(true);
    this.productStore.setQtyModalOpen(true);
    this.productStore.setSelectedProductId(null);
    this.closed.emit();
  }

  buyNow(event: Event) {
    event.stopPropagation();
    if (!this.authStore.isLoggedIn()) {
      this.goToLogin();
      return;
    }
    if (this.product()!.stock <= 0) {
      this.alertService.confirm(
        'Stok Kosong',
        'Saat ini stok produk sedang kosong. Anda tetap bisa membelinya untuk diproses nanti. Lanjutkan?',
        'Ya, Beli'
      ).then((isConfirmed) => {
        if (isConfirmed) {
          this.executeOpenQtyModal('buy');
        }
      });
      return;
    }
    this.executeOpenQtyModal('buy');
  }

  goToLogin() {
    this.closed.emit();
    this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
  }

  goBack() {
    if (this.productId()) {
      this.closed.emit();
    } else {
      this.location.back();
    }
  }

  toggleWishlist() {
    this.isWishlisted.update(v => !v);
    if (this.isWishlisted()) {
      this.alertService.success('Produk ditambahkan ke wishlist');
    } else {
      this.alertService.info('Produk dihapus dari wishlist');
    }
  }

  hasSpecs(): boolean {
    const prod = this.product();
    if (!prod) return false;
    return !!(prod.isbn || prod.publisher || prod.publishedYear || prod.pages || prod.weight || prod.sapCode);
  }

  onImageError() {
    this.imageError.set(true);
  }
}
