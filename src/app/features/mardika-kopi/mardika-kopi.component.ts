import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ProductStore } from '../../store/product.store';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { Product } from '../../core/models';
import { ScreenService } from '../../core/services/screen.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { MasonryGridComponent } from '../../shared/ui/masonry-grid/masonry-grid.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { MardikaKopiDetailComponent } from './mardika-kopi-detail/mardika-kopi-detail.component';
import { PromotionBannerStore } from '../../store/promotion-banner.store';
import { ItemApiService } from '../../core/services/item-api.service';
import { resolveImageUrl } from '../../shared/util/image.util';
import { isAdminSession } from '../../core/auth/session.util';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mardika-kopi',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SkeletonComponent, MasonryGridComponent, BottomSheetComponent, ModalComponent, MardikaKopiDetailComponent],
  templateUrl: './mardika-kopi.component.html'
})
export class MardikaKopiComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly screen = inject(ScreenService);
  protected readonly productStore = inject(ProductStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);

  protected readonly bannerStore = inject(PromotionBannerStore);
  private readonly itemApi = inject(ItemApiService);

  slides = [
    {
      badge: 'Bookstore Reimagined',
      title: 'Find Books & Items That Ignite Your Mind',
      description: 'Discover a premium collection of literary classics, coding books, journals, pens, and custom digital audiobooks.',
      buttonText: 'Browse Books',
      buttonLink: '/product',
      promoCode: 'PROMO10',
      bgGradient: 'from-primary-700 via-primary-600 to-rose-500',
      imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'
    },
    {
      badge: 'Special Promotion',
      title: 'Pena & Jurnal Premium Eksklusif',
      description: 'Tingkatkan kualitas catatan harian Anda dengan aksesoris buatan pengrajin lokal berbahan jati dan kulit asli.',
      buttonText: 'Lihat Aksesoris',
      buttonLink: '/product',
      promoCode: 'CRAFT20',
      bgGradient: 'from-slate-950 via-purple-950 to-indigo-900',
      imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'
    },
    {
      badge: 'Digital Library',
      title: 'Dengarkan Audiobooks Di Mana Saja',
      description: 'Nikmati kisah sastra klasik yang dinarasikan oleh pengisi suara profesional dalam bentuk berkas audio berkualitas tinggi.',
      buttonText: 'Cari Audiobooks',
      buttonLink: '/product',
      promoCode: 'AUDIO5',
      bgGradient: 'from-emerald-950 via-teal-900 to-amber-900',
      imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  currentSlide = signal<number>(0);
  kopiItems = signal<Product[]>([]);
  kopiLoading = signal(true);

  private embla?: EmblaCarouselType;
  private bestSellerEmbla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('bestSellerCarouselViewport') bestSellerCarouselViewport!: ElementRef<HTMLElement>;

  isItemSheetOpen = signal(false);
  selectedKopiId = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.kopiItems().length > 0) {
        setTimeout(() => {
          if (this.bestSellerEmbla) {
            this.bestSellerEmbla.reInit();
            const autoplay = this.bestSellerEmbla.plugins()['autoplay'];
            if (autoplay) {
              autoplay.reset();
              autoplay.play();
            }
          }
        }, 100);
      }
    });

    effect(() => {
      if (this.bannerStore.banners().length > 0) {
        setTimeout(() => {
          if (this.embla) {
            this.embla.reInit();
            const autoplay = this.embla.plugins()['autoplay'];
            if (autoplay) {
              autoplay.reset();
              autoplay.play();
            }
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.bannerStore.loadActiveBanners();
    this.loadKopiItems();
  }

  async loadKopiItems() {
    this.kopiLoading.set(true);
    try {
      const allItems = await this.itemApi.getItems();
      const items = allItems.filter(i => (isAdminSession() || i.isActive !== false) && i.itemType === 'mardika');
      const products: Product[] = [];

      for (const item of items) {
        products.push({
          id: item.id,
          title: item.name,
          sapCode: item.sapCode,
          authorIds: [],
          authors: [],
          authorNames: 'Mardika Kopi',
          isbn: '',
          categoryId: '',
          categoryName: item.itemType,
          price: item.price || 0,
          description: item.description,
          coverImage: resolveImageUrl((item as any).coverImage || ''),
          publisher: '',
          publishedYear: new Date().getFullYear(),
          pages: 0,
          weight: 0,
          stock: 99,
          averageRating: 5,
          totalReviews: 12,
          salesUomCode: item.salesUomCode,
          customerGroupCode: item.customerGroupCode,
          priceStartDate: item.priceStartDate,
          priceEndDate: item.priceEndDate,
          compareAtPrice: item.compareAtPrice,
          compareAtPriceStartDate: item.compareAtPriceStartDate,
          compareAtPriceEndDate: item.compareAtPriceEndDate,
          createdAt: item.createdAt || new Date().toISOString(),
          uomGroup: item.uomGroup,
          baseUomCode: item.baseUomCode,
          additionalImages: (item as any).additionalImages || []
        });
      }
      this.kopiItems.set(products);
    } catch (e) {
      console.error(e);
    } finally {
      this.kopiLoading.set(false);
    }
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    this.embla = EmblaCarousel(
      this.carouselViewport.nativeElement,
      { loop: true, align: 'start', duration: 40 },
      [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onSelect = () => this.currentSlide.set(this.embla!.selectedScrollSnap());
    this.embla.on('select', onSelect);
    onSelect();



    if (this.bestSellerCarouselViewport) {
      this.bestSellerEmbla = EmblaCarousel(
        this.bestSellerCarouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 40 },
        [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
      );
    }
  }

  ngOnDestroy() {
    this.embla?.destroy();
    this.bestSellerEmbla?.destroy();
  }

  // Invoked when user taps on dot indicators
  scrollToSlide(index: number) {
    this.embla?.scrollTo(index);
  }

  scrollPrev() {
    this.embla?.scrollPrev();
  }

  scrollNext() {
    this.embla?.scrollNext();
  }

  filterByCategory(catId: string | null) {
    this.productStore.setCategoryFilter(catId);
  }

  openQtyModal(product: any) {
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setQtyModalOpen(true);
  }

  openItemSheet(prod: Product) {
    this.selectedKopiId.set(prod.id);
    this.isItemSheetOpen.set(true);
  }

  closeItemSheet() {
    this.isItemSheetOpen.set(false);
    this.selectedKopiId.set(null);
  }

}
