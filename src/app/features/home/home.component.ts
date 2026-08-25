import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, effect, computed } from '@angular/core';
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
  selectedAuthor = signal<any | null>(null);
  selectedAuthorName = signal<string>('');

  readonly selectedAuthorProducts = computed(() => {
    const author = this.selectedAuthor();
    if (!author) return [];

    const targetId = author.id ? String(author.id).trim().toLowerCase() : '';
    const targetName = author.name ? String(author.name).trim().toLowerCase() : '';

    return this.productStore.products().filter(p => {
      const matchIds = p.authorIds && Array.isArray(p.authorIds) && p.authorIds.some(id => String(id).trim().toLowerCase() === targetId);
      const matchAuthors = p.authors && Array.isArray(p.authors) && p.authors.some(a => 
        (a.id && String(a.id).trim().toLowerCase() === targetId) ||
        (a.name && String(a.name).trim().toLowerCase() === targetName)
      );
      const matchName = p.authorNames && targetName && p.authorNames.toLowerCase().includes(targetName);
      const matchTitle = targetName.length > 2 && (
        (p.title && p.title.toLowerCase().includes(targetName)) ||
        (p.description && p.description.toLowerCase().includes(targetName))
      );

      return Boolean(matchIds || matchAuthors || matchName || matchTitle);
    });
  });

  readonly catalogProducts = this.productStore.filteredProducts;

  readonly displayAuthors = computed(() => {
    const raw = this.authorStore.authors();
    if (raw.length === 0) return [];
    if (raw.length < 8) {
      const times = Math.ceil(8 / raw.length);
      const result: typeof raw = [];
      for (let i = 0; i < times; i++) {
        result.push(...raw);
      }
      return result;
    }
    return raw;
  });

  readonly displayBestSellers = computed(() => {
    const raw = this.productStore.products();
    if (raw.length === 0) return [];
    if (raw.length < 8) {
      const times = Math.ceil(8 / raw.length);
      const result: typeof raw = [];
      for (let i = 0; i < times; i++) {
        result.push(...raw);
      }
      return result;
    }
    return raw;
  });

  private embla?: EmblaCarouselType;
  private authorEmbla?: EmblaCarouselType;
  private bestSellerEmbla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport?: ElementRef<HTMLElement>;
  @ViewChild('authorCarouselViewport') authorCarouselViewport?: ElementRef<HTMLElement>;
  @ViewChild('bestSellerCarouselViewport') bestSellerCarouselViewport?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      if (this.displayBestSellers().length > 0) {
        setTimeout(() => {
          if (!this.bestSellerEmbla) {
            this.initBestSellerCarousel();
          } else {
            this.bestSellerEmbla.reInit();
          }
        }, 50);
      }
    });

    effect(() => {
      if (this.bannerStore.banners().length > 0) {
        setTimeout(() => {
          if (!this.embla) {
            this.initHeroCarousel();
          } else {
            this.embla.reInit();
          }
        }, 50);
      }
    });

    effect(() => {
      if (this.displayAuthors().length > 0) {
        setTimeout(() => {
          if (!this.authorEmbla) {
            this.initAuthorCarousel();
          } else {
            this.authorEmbla.reInit();
          }
        }, 50);
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
    this.initHeroCarousel();
    this.initBestSellerCarousel();
    this.initAuthorCarousel();
  }

  private initHeroCarousel() {
    if (!this.carouselViewport?.nativeElement || this.embla) return;
    this.embla = EmblaCarousel(
      this.carouselViewport.nativeElement,
      { loop: true, align: 'start', duration: 25 },
      [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onSelect = () => this.currentSlide.set(this.embla!.selectedScrollSnap());
    this.embla.on('select', onSelect);
    onSelect();
  }

  private initBestSellerCarousel() {
    if (!this.bestSellerCarouselViewport?.nativeElement || this.bestSellerEmbla) return;
    this.bestSellerEmbla = EmblaCarousel(
      this.bestSellerCarouselViewport.nativeElement,
      { loop: true, align: 'start', duration: 25 },
      [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );
  }

  private initAuthorCarousel() {
    if (!this.authorCarouselViewport?.nativeElement || this.authorEmbla) return;
    this.authorEmbla = EmblaCarousel(
      this.authorCarouselViewport.nativeElement,
      { loop: true, align: 'start', duration: 25 },
      [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onAuthorSelect = () => this.currentAuthorSlide.set(this.authorEmbla!.selectedScrollSnap());
    this.authorEmbla.on('select', onAuthorSelect);
    onAuthorSelect();
  }

  ngOnDestroy() {
    this.embla?.destroy();
    this.authorEmbla?.destroy();
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

  bestSellerPrev() {
    if (this.bestSellerEmbla) {
      if (this.bestSellerEmbla.canScrollPrev()) {
        this.bestSellerEmbla.scrollPrev();
      } else {
        const snaps = this.bestSellerEmbla.scrollSnapList();
        this.bestSellerEmbla.scrollTo(snaps.length - 1);
      }
    }
  }

  bestSellerNext() {
    if (this.bestSellerEmbla) {
      if (this.bestSellerEmbla.canScrollNext()) {
        this.bestSellerEmbla.scrollNext();
      } else {
        this.bestSellerEmbla.scrollTo(0);
      }
    }
  }

  authorPrev() {
    if (this.authorEmbla) {
      if (this.authorEmbla.canScrollPrev()) {
        this.authorEmbla.scrollPrev();
      } else {
        const snaps = this.authorEmbla.scrollSnapList();
        this.authorEmbla.scrollTo(snaps.length - 1);
      }
    }
  }

  authorNext() {
    if (this.authorEmbla) {
      if (this.authorEmbla.canScrollNext()) {
        this.authorEmbla.scrollNext();
      } else {
        this.authorEmbla.scrollTo(0);
      }
    }
  }

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
    this.selectedAuthorName.set(author.name || '');
    this.isAuthorSheetOpen.set(true);
  }

  closeAuthorSheet() {
    this.isAuthorSheetOpen.set(false);
  }
}
