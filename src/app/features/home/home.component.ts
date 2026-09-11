import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy, effect, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ProductStore } from '../../store/product.store';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { Product } from '../../core/models';
import { ScreenService } from '../../core/services/screen.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { MardikaKopiDetailComponent } from '../mardika-kopi/mardika-kopi-detail/mardika-kopi-detail.component';
import { PromotionBannerStore } from '../../store/promotion-banner.store';
import { ItemApiService } from '../../core/services/item-api.service';
import { LoggerService } from '../../core/services/logger.service';
import { resolveImageUrl } from '../../shared/util/image.util';
import { isAdminSession } from '../../core/auth/session.util';
import { SeoService } from '../../core/services/seo.service';

export interface KopiTestimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  photoUrl: string;
}

export interface KopiShowcaseCard {
  title: string;
  tag: string;
  subtag: string;
  price: string;
  image: string;
  description: string;
  link: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    BottomSheetComponent,
    ModalComponent,
    MardikaKopiDetailComponent
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly screen = inject(ScreenService);
  protected readonly productStore = inject(ProductStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly bannerStore = inject(PromotionBannerStore);
  private readonly itemApi = inject(ItemApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  currentSlide = signal<number>(0);
  kopiItems = signal<Product[]>([]);
  kopiLoading = signal(true);

  private embla?: EmblaCarouselType;
  private bestSellerEmbla?: EmblaCarouselType;
  private showcaseEmbla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('bestSellerCarouselViewport') bestSellerCarouselViewport!: ElementRef<HTMLElement>;
  @ViewChild('kopiShowcaseCarouselViewport') kopiShowcaseCarouselViewport?: ElementRef<HTMLElement>;

  isItemSheetOpen = signal(false);
  selectedKopiId = signal<string | null>(null);

  // Tabs for Flagship Products
  signatureActiveTab = signal<number>(0);
  gayoActiveTab = signal<number>(0);

  // FAQ Accordion State
  openFaqIndex = signal<number | null>(null);

  // Newsletter State
  newsletterEmail = signal<string>('');
  isSubscribed = signal<boolean>(false);

  // Testimonials Navigation State
  testimonialIndex = signal<number>(0);

  // Showcase Cards Carousel State
  currentShowcaseSlide = signal<number>(0);

  readonly testimonials = signal<KopiTestimonial[]>([
    {
      name: 'Satria Wicaksana',
      role: 'Certified Q-Grader & Roaster',
      company: 'Komunitas Kopi Nusantara',
      quote: 'Mardika Signature Blend punya profil sangrai yang sangat presisi. Perpaduan arabika dan fine robustanya menghasilkan bodi yang bulat dengan aftertaste dark chocolate yang bersih di lambung tanpa rasa pahit gosong.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Dimas Anggara',
      role: 'Penikmat Kopi & Pembaca Malaka Books',
      company: 'Ruang Dialektika Bandung',
      quote: 'Kopi Arabica Gayo-nya luar biasa segar saat diseduh V60. Notes citrus dan honey blossom-nya beneran keluar. Jadi teman wajib setiap kali membuka buku "Makanya Mikir" atau bedah argumen di ruang diskusi.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Sarah Clarissa',
      role: 'Creative Director & Home Brewer',
      company: 'Studio Titik Koma',
      quote: 'Sangat mengapresiasi kemasan one-way valve kedap udaranya. Biji kopi yang tiba selalu fresh roasted dengan tanggal sangrai yang transparan. Drip bag box-nya juga praktis banget dibawa saat dinas kerja.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Fajar Ramadhan',
      role: 'Podcaster & Pegiat Diskusi Kritis',
      company: 'Nalar Merdeka Podcast',
      quote: 'Mardika Kopi bukan sekadar jualan komoditas, tapi membawa kultur nongkrong bermutu. Rasanya solid, harganya terjangkau untuk biji kopi specialty kelas atas.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
    }
  ]);

  readonly currentTestimonial = computed(() => {
    const list = this.testimonials();
    const idx = this.testimonialIndex() % list.length;
    return list[idx] || list[0];
  });

  readonly mardikaKopiCards = signal<KopiShowcaseCard[]>([
    {
      title: 'Mardika Signature Blend',
      tag: 'Signature Roastery',
      subtag: '100% Arabica & Fine Robusta',
      price: 'Rp 45.000',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      description: 'Karakter rasa dark chocolate, karamel manis, dan bodi tebal. Teman terbaik membaca mendalam dan kopi susu aren.',
      link: '/'
    },
    {
      title: 'Arabica Gayo Single Origin',
      tag: 'Single Origin',
      subtag: '100% Arabica Full Wash',
      price: 'Rp 65.000',
      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
      description: 'Aroma floral jeruk dengan keasaman segar dan body medium seimbang. Pas untuk seduhan pour over V60 manual.',
      link: '/'
    },
    {
      title: 'Robusta Temanggung Roastery',
      tag: 'Fine Robusta',
      subtag: '100% Robusta Natural',
      price: 'Rp 35.000',
      image: 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?auto=format&fit=crop&w=800&q=80',
      description: 'Body tebal mantap dengan notes dark cocoa dan rempah gurih tanpa rasa pahit gosong berlebih.',
      link: '/'
    },
    {
      title: 'Mardika Cold Brew Concentrate',
      tag: 'Cold Brew Series',
      subtag: 'Ready to Drink 500ml',
      price: 'Rp 55.000',
      image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
      description: 'Ekstraksi dingin 16 jam menghasilkan kopi pekat yang lembut di lambung dan menyegarkan.',
      link: '/'
    },
    {
      title: 'Drip Bag Coffee Box (5 Sachet)',
      tag: 'Drip Bag Praktis',
      subtag: 'Travel Friendly',
      price: 'Rp 48.000',
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
      description: 'Nikmati kopi filter artisan di mana saja tanpa alat seduh khusus. Cukup tuang air panas.',
      link: '/'
    },
    {
      title: 'Mardika Aren Espresso Latte',
      tag: 'Signature Milk Base',
      subtag: 'Fresh Brew 250ml',
      price: 'Rp 28.000',
      image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80',
      description: 'Perpaduan espresso mantap, susu creamy, dan gula aren organik asli yang legit dan pas.',
      link: '/'
    }
  ]);

  // Computed Flagship Products
  readonly signatureProduct = computed<Product>(() => {
    const items = this.kopiItems();
    const found = items.find(p =>
      p.title.toLowerCase().includes('signature') ||
      p.title.toLowerCase().includes('blend')
    );
    if (found) return found;

    return {
      id: 'kopi-signature-blend',
      title: 'Mardika Signature Blend (250g)',
      sapCode: 'KOP-SIG-250',
      authorIds: [],
      authors: [],
      authorNames: 'Mardika Kopi Roastery',
      isbn: '',
      categoryId: 'cat-kopi-roastery',
      categoryName: 'mardika',
      price: 45000,
      compareAtPrice: 55000,
      description: 'Biji kopi sangrai artisan perpaduan Arabica & Fine Robusta pilihan. Tasting notes cokelat karamel, bodi mantap dan aftertaste manis seimbang.',
      coverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      publisher: 'Mardika Roastery',
      publishedYear: 2025,
      pages: 0,
      weight: 250,
      stock: 50,
      averageRating: 4.9,
      totalReviews: 86,
      createdAt: new Date().toISOString(),
      additionalImages: []
    } as Product;
  });

  readonly gayoProduct = computed<Product>(() => {
    const items = this.kopiItems();
    const found = items.find(p =>
      p.title.toLowerCase().includes('gayo') ||
      p.title.toLowerCase().includes('arabica')
    );
    if (found) return found;

    return {
      id: 'kopi-gayo-single-origin',
      title: 'Arabica Gayo Single Origin (200g)',
      sapCode: 'KOP-GAYO-200',
      authorIds: [],
      authors: [],
      authorNames: 'Mardika Kopi Roastery',
      isbn: '',
      categoryId: 'cat-kopi-roastery',
      categoryName: 'mardika',
      price: 65000,
      compareAtPrice: 78000,
      description: '100% Arabica Specialty Single Origin dataran tinggi Aceh Gayo. Proses basah (full wash) menghasilkan aroma floral jeruk dengan keasaman bersih dan manis madu.',
      coverImage: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
      publisher: 'Mardika Roastery',
      publishedYear: 2025,
      pages: 0,
      weight: 200,
      stock: 40,
      averageRating: 5.0,
      totalReviews: 64,
      createdAt: new Date().toISOString(),
      additionalImages: []
    } as Product;
  });

  readonly bundleProduct = computed<Product>(() => {
    const items = this.kopiItems();
    const found = items.find(p =>
      p.title.toLowerCase().includes('bundle') ||
      p.title.toLowerCase().includes('paket') ||
      p.title.toLowerCase().includes('explorer')
    );
    if (found) return found;

    return {
      id: 'kopi-bundle-explorer',
      title: 'Paket Bundling Mardika Kopi Explorer (Signature + Gayo + Drip Bag)',
      sapCode: 'KOP-BUN-01',
      authorIds: [],
      authors: [],
      authorNames: 'Mardika Kopi Roastery',
      isbn: '',
      categoryId: 'cat-kopi-roastery',
      categoryName: 'mardika',
      price: 120000,
      compareAtPrice: 150000,
      description: 'Paket lengkap penjelajah rasa: Mardika Signature Blend 250g, Arabica Gayo 200g, plus Drip Bag Coffee Box (5 sachet) dan stiker eksklusif Mardika.',
      coverImage: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
      publisher: 'Mardika Roastery',
      publishedYear: 2025,
      pages: 0,
      weight: 600,
      stock: 30,
      averageRating: 5.0,
      totalReviews: 42,
      createdAt: new Date().toISOString(),
      additionalImages: []
    } as Product;
  });

  readonly dripProduct = computed<Product>(() => {
    const items = this.kopiItems();
    const found = items.find(p =>
      p.title.toLowerCase().includes('drip') ||
      p.title.toLowerCase().includes('sachet')
    );
    if (found) return found;

    return {
      id: 'kopi-drip-box',
      title: 'Drip Bag Coffee Box (5 Sachet)',
      sapCode: 'KOP-DRP-05',
      authorIds: [],
      authors: [],
      authorNames: 'Mardika Kopi Roastery',
      isbn: '',
      categoryId: 'cat-kopi-roastery',
      categoryName: 'mardika',
      price: 48000,
      compareAtPrice: 55000,
      description: 'Nikmati seduhan kopi filter artisan di mana saja tanpa alat seduh khusus. Berisi 5 sachet kopi single origin dengan filter gantung food-grade.',
      coverImage: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
      publisher: 'Mardika Roastery',
      publishedYear: 2025,
      pages: 0,
      weight: 150,
      stock: 35,
      averageRating: 5.0,
      totalReviews: 38,
      createdAt: new Date().toISOString(),
      additionalImages: []
    } as Product;
  });

  readonly beverageProduct = computed<Product>(() => {
    const items = this.kopiItems();
    const found = items.find(p =>
      p.title.toLowerCase().includes('cold brew') ||
      p.title.toLowerCase().includes('latte') ||
      p.title.toLowerCase().includes('aren')
    );
    if (found) return found;

    return {
      id: 'kopi-cold-brew',
      title: 'Mardika Cold Brew Concentrate (500ml)',
      sapCode: 'KOP-CLD-500',
      authorIds: [],
      authors: [],
      authorNames: 'Mardika Kopi Roastery',
      isbn: '',
      categoryId: 'cat-kopi-beverage',
      categoryName: 'mardika',
      price: 55000,
      compareAtPrice: 65000,
      description: 'Ekstraksi dingin perlahan selama 16 jam menghasilkan konsentrat kopi dengan rasa manis alami seimbang, bebas rasa asam menusuk, dan siap saji.',
      coverImage: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
      publisher: 'Mardika Roastery',
      publishedYear: 2025,
      pages: 0,
      weight: 550,
      stock: 25,
      averageRating: 4.9,
      totalReviews: 54,
      createdAt: new Date().toISOString(),
      additionalImages: []
    } as Product;
  });

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
    this.seoService.updatePage({
      title: 'Mardika Kopi — Artisan Specialty Coffee Penjaga Nalar & Diskusi',
      description: 'Koleksi biji kopi specialty sangrai segar dari Aceh Gayo, Temanggung, dan Flores untuk menjaga ketajaman fokus membaca dan kejernihan berpikir.'
    });
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
          authorNames: 'Mardika Kopi Roastery',
          isbn: '',
          categoryId: '',
          categoryName: item.itemType,
          price: item.price || 0,
          description: item.description,
          coverImage: resolveImageUrl((item as {coverImage?: string}).coverImage || ''),
          publisher: 'Mardika Roastery',
          publishedYear: new Date().getFullYear(),
          pages: 0,
          weight: 250,
          stock: 99,
          averageRating: 5,
          totalReviews: 18,
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
          additionalImages: ((item as {additionalImages?: string[]}).additionalImages || []) as unknown as any[]
        });
      }
      this.kopiItems.set(products);
    } catch (e) {
      this.logger.error('Gagal memuat produk Mardika Kopi', e);
    } finally {
      this.kopiLoading.set(false);
    }
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    if (this.carouselViewport?.nativeElement) {
      this.embla = EmblaCarousel(
        this.carouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 40 },
        [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
      );

      const onSelect = () => this.currentSlide.set(this.embla!.selectedScrollSnap());
      this.embla.on('select', onSelect);
      onSelect();
    }

    if (this.bestSellerCarouselViewport?.nativeElement) {
      this.bestSellerEmbla = EmblaCarousel(
        this.bestSellerCarouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 40 },
        [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]
      );
    }

    if (this.kopiShowcaseCarouselViewport?.nativeElement) {
      this.showcaseEmbla = EmblaCarousel(
        this.kopiShowcaseCarouselViewport.nativeElement,
        { loop: true, align: 'start', duration: 35 }
      );
      const onShowcaseSelect = () => {
        if (this.showcaseEmbla) {
          this.currentShowcaseSlide.set(this.showcaseEmbla.selectedScrollSnap());
        }
      };
      this.showcaseEmbla.on('select', onShowcaseSelect);
      onShowcaseSelect();
    }
  }

  ngOnDestroy() {
    this.embla?.destroy();
    this.bestSellerEmbla?.destroy();
    this.showcaseEmbla?.destroy();
  }

  scrollToSlide(index: number) {
    this.embla?.scrollTo(index);
  }

  scrollPrev() {
    this.embla?.scrollPrev();
  }

  scrollNext() {
    this.embla?.scrollNext();
  }

  // Showcase Carousel Controls
  kopiShowcasePrev() {
    this.showcaseEmbla?.scrollPrev();
  }

  kopiShowcaseNext() {
    this.showcaseEmbla?.scrollNext();
  }

  scrollShowcaseToSlide(index: number) {
    this.showcaseEmbla?.scrollTo(index);
  }

  // Direct Purchasing
  buyDirect(kopiType: 'signature' | 'gayo' | 'bundle' | 'drip' | 'beverage') {
    let target: Product;
    if (kopiType === 'signature') {
      target = this.signatureProduct();
    } else if (kopiType === 'gayo') {
      target = this.gayoProduct();
    } else if (kopiType === 'drip') {
      target = this.dripProduct();
    } else if (kopiType === 'beverage') {
      target = this.beverageProduct();
    } else {
      target = this.bundleProduct();
    }
    this.openQtyModal(target, 'buy');
  }

  openQtyModal(product: Product, action: 'cart' | 'buy' = 'buy') {
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction(action);
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

  toggleFaq(index: number) {
    this.openFaqIndex.update(cur => cur === index ? null : index);
  }

  setSignatureTab(idx: number) {
    this.signatureActiveTab.set(idx);
  }

  setGayoTab(idx: number) {
    this.gayoActiveTab.set(idx);
  }

  nextTestimonial() {
    this.testimonialIndex.update(i => (i + 1) % this.testimonials().length);
  }

  prevTestimonial() {
    this.testimonialIndex.update(i => (i - 1 + this.testimonials().length) % this.testimonials().length);
  }

  submitNewsletter(e: Event) {
    e.preventDefault();
    if (this.newsletterEmail().trim()) {
      this.isSubscribed.set(true);
      setTimeout(() => {
        this.newsletterEmail.set('');
      }, 2000);
    }
  }
}
