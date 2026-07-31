import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ProductStore } from '../../store/product.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { MasonryGridComponent } from '../../shared/ui/masonry-grid/masonry-grid.component';
import { ScreenService } from '../../core/services/screen.service';
import { PromotionBannerStore } from '../../store/promotion-banner.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SkeletonComponent, IconComponent, MasonryGridComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly bannerStore = inject(PromotionBannerStore);
  protected readonly screen = inject(ScreenService);

  slides = [
    {
      badge: 'Pusat Belanja',
      title: 'Temukan Berbagai Produk Pilihan Terlengkap',
      description: 'Jelajahi koleksi barang harian, peralatan, aksesoris, dan gaya hidup berkualitas di SS Online Shop.',
      buttonText: 'Mulai Belanja',
      buttonLink: '/product',
      promoCode: 'SHOP10',
      bgGradient: 'from-indigo-800 via-indigo-700 to-blue-900',
      imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'
    },
    {
      badge: 'Special Promo',
      title: 'Kebutuhan Rumah & Peralatan Modern',
      description: 'Lengkapi rumah dan aktivitas Anda dengan peralatan praktis dan berkualitas tinggi.',
      buttonText: 'Lihat Promo',
      buttonLink: '/product',
      promoCode: 'PROMO20',
      bgGradient: 'from-slate-900 via-slate-800 to-indigo-950',
      imageUrl: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      badge: 'Lifestyle & Aksesoris',
      title: 'Aksesoris & Perlengkapan Gaya Hidup',
      description: 'Dapatkan aksesoris pilihan terbaik dengan penawaran menarik hanya di SS Online Shop.',
      buttonText: 'Cari Produk',
      buttonLink: '/product',
      promoCode: 'STYLE15',
      bgGradient: 'from-emerald-950 via-teal-900 to-blue-950',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  currentSlide = signal<number>(0);

  private embla?: EmblaCarouselType;
  private bestSellerEmbla?: EmblaCarouselType;
  private merchandiseEmbla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('bestSellerCarouselViewport') bestSellerCarouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('merchandiseCarouselViewport') merchandiseCarouselViewport!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      if (this.productStore.products().length > 0) {
        setTimeout(() => {
          if (this.bestSellerEmbla) {
            this.bestSellerEmbla.reInit();
            const autoplay = this.bestSellerEmbla.plugins()['autoplay'];
            if (autoplay) {
              autoplay.reset();
              autoplay.play();
            }
          }
          if (this.merchandiseEmbla) {
            this.merchandiseEmbla.reInit();
            const merchAutoplay = this.merchandiseEmbla.plugins()['autoplay'];
            if (merchAutoplay) {
              merchAutoplay.reset();
              merchAutoplay.play();
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
    this.productStore.loadAll();
    this.bannerStore.loadActiveBanners();
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

    if (this.merchandiseCarouselViewport) {
      this.merchandiseEmbla = EmblaCarousel(
        this.merchandiseCarouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 40 },
        [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]
      );
    }

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
    this.merchandiseEmbla?.destroy();
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

  bestSellerPrev() { this.bestSellerEmbla?.scrollPrev(); }
  bestSellerNext() { this.bestSellerEmbla?.scrollNext(); }
  merchandisePrev() { this.merchandiseEmbla?.scrollPrev(); }
  merchandiseNext() { this.merchandiseEmbla?.scrollNext(); }

  filterByCategory(catId: string | null) {
    this.productStore.setCategoryFilter(catId);
  }

  openQtyModal(product: any) {
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setQtyModalOpen(true);
  }
}
