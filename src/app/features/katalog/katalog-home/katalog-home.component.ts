import { Component, signal, computed, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { ProductStore } from '../../../store/product.store';
import { KatalogCartStore } from '../../../store/katalog-cart.store';
import { AuthStore } from '../../../store/auth.store';
import { PromotionBannerStore } from '../../../store/promotion-banner.store';
import { KatalogToastService } from '../../../core/services/katalog-toast.service';
import { getCategoryIcon } from '../../../core/utils/category-icon';
import { KatalogProductCardComponent } from '../components/katalog-product-card/katalog-product-card.component';
import { KatalogSelectionSheetComponent } from '../components/katalog-selection-sheet/katalog-selection-sheet.component';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-katalog-home',
  standalone: true,
  imports: [FormsModule, RouterLink, KatalogProductCardComponent, KatalogSelectionSheetComponent],
  templateUrl: './katalog-home.component.html',
  host: { 'class': 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  cartStore = inject(KatalogCartStore);
  productStore = inject(ProductStore);
  authStore = inject(AuthStore);
  bannerStore = inject(PromotionBannerStore);
  private router = inject(Router);
  private toastService = inject(KatalogToastService);

  // Onboarding State
  showOnboarding = signal<boolean>(false);
  isOnboardingVisible = signal<boolean>(false);
  tempName = signal<string>('');

  // Bottom Sheet State
  selectedProductForSheet = signal<Product | null>(null);

  selectedCategoryId = signal<string | null>(null);
  
  // Carousel State
  currentSlide = signal<number>(0);
  private embla?: EmblaCarouselType;
  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;

  constructor() {
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

  itemCategories = computed<CategoryItem[]>(() => {
    const cats = this.productStore.categories();
    return [
      { id: '', name: 'Semua', icon: 'bx-category' },
      ...cats.map(c => ({
        id: c.id,
        name: c.name,
        icon: getCategoryIcon(c.id)
      }))
    ];
  });

  userName = computed(() => {
    const authName = this.authStore.currentUser()?.name;
    if (authName) return authName;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('mk_katalog_user_name') || '';
    }
    return '';
  });

  ngOnInit() {
    this.productStore.loadAll();
    this.bannerStore.loadActiveBanners();
    this.checkUserOnboarding();
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined' || !this.carouselViewport) return;
    this.embla = EmblaCarousel(
      this.carouselViewport.nativeElement,
      { loop: true, align: 'start', duration: 40 },
      [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onSelect = () => this.currentSlide.set(this.embla!.selectedScrollSnap());
    this.embla.on('select', onSelect);
    onSelect();
  }

  ngOnDestroy() {
    this.embla?.destroy();
  }
  
  scrollToSlide(index: number) {
    this.embla?.scrollTo(index);
  }

  checkUserOnboarding() {
    if (!this.userName()) {
      this.showOnboarding.set(true);
      setTimeout(() => this.isOnboardingVisible.set(true), 10);
    }
  }

  submitOnboarding() {
    if (this.tempName().trim()) {
      this.isOnboardingVisible.set(false);
      setTimeout(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('mk_katalog_user_name', this.tempName().trim());
        }
        this.showOnboarding.set(false);
        this.toastService.success('Selamat Datang!', `Halo ${this.tempName()}, selamat berbelanja!`);
      }, 300);
    }
  }

  goToSearch() {
    this.router.navigate(['/katalog/search']);
  }

  filteredProducts = computed(() => {
    let list = this.productStore.products();
    const catId = this.selectedCategoryId();
    if (catId) {
      list = list.filter(p => p.categoryId === catId);
    }
    return list;
  });

  leftColumnProducts = computed(() => this.filteredProducts().filter((_, i) => i % 2 === 0));
  rightColumnProducts = computed(() => this.filteredProducts().filter((_, i) => i % 2 !== 0));
}
