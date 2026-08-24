import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ProductStore } from '../../store/product.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { AuthStore } from '../../store/auth.store';
import { Product } from '../../core/models';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { MasonryGridComponent } from '../../shared/ui/masonry-grid/masonry-grid.component';
import { ScreenService } from '../../core/services/screen.service';
import { PromotionBannerStore } from '../../store/promotion-banner.store';
import { AuthorStore } from '../../store/author.store';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SkeletonComponent, IconComponent, MasonryGridComponent, BottomSheetComponent, ModalComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly bannerStore = inject(PromotionBannerStore);
  protected readonly authorStore = inject(AuthorStore);
  protected readonly screen = inject(ScreenService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  currentSlide = signal<number>(0);
  currentAuthorSlide = signal<number>(0);
  isAuthorSheetOpen = signal(false);
  selectedAuthorName = signal<string>('');
  selectedAuthorProducts = signal<any[]>([]);
  selectedAuthor = signal<any | null>(null);

  readonly catalogProducts = this.productStore.filteredProducts;

  private embla?: EmblaCarouselType;
  private authorEmbla?: EmblaCarouselType;
  private bestSellerEmbla?: EmblaCarouselType;
  private merchandiseEmbla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('authorCarouselViewport') authorCarouselViewport?: ElementRef<HTMLElement>;
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

    effect(() => {
      if (this.authorStore.authors().length > 0) {
        setTimeout(() => {
          if (this.authorEmbla) {
            this.authorEmbla.reInit();
            const authAutoplay = this.authorEmbla.plugins()['autoplay'];
            if (authAutoplay) {
              authAutoplay.reset();
              authAutoplay.play();
            }
          }
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.seoService.updatePage({
      title: 'Kopi Mardika - Toko Kopi Online & Retail Terlengkap',
      description: 'Temukan koleksi kopi Mardika premium, dan kebutuhan sembako retail terbaik hanya di Kopi Mardika.'
    });
    this.productStore.loadAll();
    this.bannerStore.loadActiveBanners();
    this.authorStore.loadAuthors();
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

    if (this.authorCarouselViewport) {
      this.authorEmbla = EmblaCarousel(
        this.authorCarouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 40 },
        [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]
      );
      const onAuthorSelect = () => this.currentAuthorSlide.set(this.authorEmbla!.selectedScrollSnap());
      this.authorEmbla.on('select', onAuthorSelect);
      onAuthorSelect();
    }

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
    this.authorEmbla?.destroy();
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
  authorPrev() { this.authorEmbla?.scrollPrev(); }
  authorNext() { this.authorEmbla?.scrollNext(); }

  filterByCategory(catId: string | null) {
    this.productStore.setCategoryFilter(catId);
  }

  openQtyModal(product: Product) {
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setQtyModalOpen(true);
  }

  openAuthorSheet(author: any) {
    this.selectedAuthor.set(author);
    this.selectedAuthorName.set(author.name);
    
    const filtered = this.productStore.products().filter(p => {
      const matchIds = p.authorIds && p.authorIds.some(id => String(id) === String(author.id));
      const matchAuthors = p.authors && p.authors.some(a => String(a.id) === String(author.id));
      return matchIds || matchAuthors;
    });

    console.log('Total products with authors:', this.productStore.products().filter(p => p.authorIds?.length > 0 || p.authors?.length > 0).length);
    
    this.selectedAuthorProducts.set(filtered);
    this.isAuthorSheetOpen.set(true);
  }

  closeAuthorSheet() {
    this.isAuthorSheetOpen.set(false);
  }
}
