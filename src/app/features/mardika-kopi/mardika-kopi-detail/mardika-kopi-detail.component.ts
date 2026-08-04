import { Component, inject, signal, OnInit, input, output, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { ToastService } from '../../../core/services/toast.service';

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
  readonly productIdInput = input<string | null>(null, { alias: 'productId' });
  readonly closed = output<void>();

  private readonly route = inject(ActivatedRoute);
  private readonly productApi = inject(ProductApiService);
  private readonly reviewApi = inject(ReviewApiService);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly productStore = inject(ProductStore);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  loading = signal<boolean>(true);
  product = signal<Product | null>(null);
  activeImage = signal<string>('');
  activeTab = signal<'details' | 'reviews'>('details');
  reviews = signal<Review[]>([]);
  isWishlisted = signal<boolean>(false);
  protected readonly imageError = signal(false);
  protected readonly Math = Math;

  constructor() {
    effect(() => {
      const id = this.productIdInput();
      if (id) {
        this.activeTab.set('details');
        this.loadProduct(id);
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
      if (id && !this.productIdInput()) {
        this.loadProduct(id);
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
        this.activeImage.set(prod.coverImage);
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
    if (this.product()!.stock <= 0) {
      Swal.fire({
        title: 'Stok Kosong',
        text: 'Saat ini stok produk sedang kosong. Anda tetap bisa memasukkannya ke keranjang untuk di-checkout nanti. Lanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Lanjutkan',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
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
    if (this.product()!.stock <= 0) {
      Swal.fire({
        title: 'Stok Kosong',
        text: 'Saat ini stok produk sedang kosong. Anda tetap bisa membelinya untuk diproses nanti. Lanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Beli',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeOpenQtyModal('buy');
        }
      });
      return;
    }
    this.executeOpenQtyModal('buy');
  }

  goToLogin() {
    this.closed.emit();
  }

  goBack() {
    if (this.productIdInput()) {
      this.closed.emit();
    } else {
      this.location.back();
    }
  }

  toggleWishlist() {
    this.isWishlisted.update(v => !v);
    if (this.isWishlisted()) {
      this.toastService.success('Produk ditambahkan ke wishlist');
    } else {
      this.toastService.info('Produk dihapus dari wishlist');
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
