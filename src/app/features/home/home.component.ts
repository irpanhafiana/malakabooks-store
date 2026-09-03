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
import { ScreenService } from '../../core/services/screen.service';
import { PromotionBannerStore } from '../../store/promotion-banner.store';
import { AuthorStore } from '../../store/author.store';
import { FormsModule } from '@angular/forms';

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  photoUrl: string;
}

export interface KeyAuthor {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  biography: string;
  quote: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
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

  protected readonly Math = Math;

  currentSlide = signal<number>(0);
  currentAuthorSlide = signal<number>(0);
  isAuthorSheetOpen = signal(false);
  selectedAuthor = signal<KeyAuthor | null>(null);
  selectedAuthorName = signal<string>('');
  openFaqIndex = signal<number | null>(0);
  activeFeatureTab = signal<number>(0);
  isVideoModalOpen = signal<boolean>(false);
  testimonialIndex = signal<number>(0);
  newsletterEmail = signal<string>('');
  isSubscribed = signal<boolean>(false);

  // Tabs for Book 1 ("Makanya, Mikir!") and Book 2 ("Prinsipil Ekonomi")
  mikirActiveTab = signal<number>(0);
  ekonomiActiveTab = signal<number>(0);

  // Testimonials list
  readonly testimonials = signal<Testimonial[]>([
    {
      name: 'Aulia Ramadhani',
      role: 'Pembaca Aktif & Reviewer Goodreads',
      company: 'Komunitas Literasi Jakarta',
      quote: 'Buku "Makanya, Mikir!" adalah tamparan halus yang sangat menyegarkan. Cania dan Abigail berhasil menjelaskan konsep sesat pikir dan pemisahan fakta vs preferensi dengan bahasa santai tongkrongan. Sangat aplikatif buat yang sering overthinking!',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Rian Pratama',
      role: 'Product Lead & Founder Komunitas',
      company: 'Evolusi Digital',
      quote: '"Prinsipil Ekonomi" dari Bang Ferry mengubah cara pandang saya seumur hidup tentang ekonomi. Bukan soal grafik rumit, melainkan seni mengalokasikan waktu dan opportunity cost. Wajib dibaca agar rasional dalam mengambil keputusan hidup.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Dr. Farhan Hidayat',
      role: 'Pendidik & Pegiat Nalar Kritis',
      company: 'Forum Gagasan Muda',
      quote: 'Paket bundling kedua buku ini adalah perpaduan sempurna: "Makanya, Mikir!" melatih fondasi logika bernalar, sedangkan "Prinsipil Ekonomi" memberikan kacamata tajam melihat motif dan pilihan hidup. Wajib ada di meja baca Anda.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Nabila Salsabila',
      role: 'Bookstagrammer & Arsitek',
      company: 'Ruang Baca Indonesia',
      quote: 'Kualitas cetak fisik Malakabooks benar-benar standar tinggi. Jilid jahit benang bikin buku bisa dibuka rebah rata 180° tanpa khawatir lepas. Proteksi pengiriman berlapis dengan ekstra karton sudut bikin buku mendarat mulus tanpa cacat.',
      photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80'
    }
  ]);

  readonly currentTestimonial = computed(() => {
    const list = this.testimonials();
    const idx = this.testimonialIndex() % list.length;
    return list[idx] || list[0];
  });

  // Dedicated data for the 3 core authors
  readonly keyAuthors = signal<KeyAuthor[]>([
    {
      id: 'author-cania-citta',
      name: 'Cania Citta',
      role: 'Co-Founder Malaka Project & Penulis',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      biography: 'Kreator konten, analis sosial-politik, dan pendiri platform edukasi nalar kritis Malaka Project. Aktif mengkampanyekan pentingnya rasionalitas, logika formal, dan metode ilmiah dalam kehidupan bermasyarakat.',
      quote: 'Kemampuan berpikir logis bukan bakat istimewa, melainkan keterampilan terukur yang bisa dan wajib dilatih setiap hari.'
    },
    {
      id: 'author-abigail-limuria',
      name: 'Abigail Limuria',
      role: 'Co-Founder Bijak Memilih & Penulis',
      photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
      biography: 'Advokat literasi kewarganegaraan, pembuat inisiatif publik Bijak Memilih, dan pegiat pemberdayaan pemuda. Berfokus pada bagaimana kerangka berpikir rasional dapat diterapkan untuk memecahkan dilema hidup personal dan kolektif.',
      quote: 'Banyak kekacauan hidup berakar bukan dari nasib buruk, melainkan dari cara kita menyusun peta realitas yang keliru.'
    },
    {
      id: 'author-ferry-irwandi',
      name: 'Ferry Irwandi',
      role: 'Founder Malaka Project & Penulis',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      biography: 'Edukator sosio-ekonomi terkemuka, videografer, dan pemrakarsa gerakan berpikir rasional. Terkenal dengan kemampuannya mengurai teori ekonomi yang rumit menjadi konsep praktis yang relevan dengan realitas masyarakat awam.',
      quote: 'Ekonomi sejatinya bukan tentang rumus atau kurva kaku, melainkan ilmu tentang bagaimana manusia mengambil pilihan hidup.'
    }
  ]);

  readonly mikirProduct = computed(() => {
    const prods = this.productStore.products();
    const found = prods.find(p =>
      p.title.toLowerCase().includes('mikir') ||
      p.title.toLowerCase().includes('makanya')
    );
    if (found) return found;

    // Fallback default structure
    return {
      id: 'book-makanya-mikir',
      title: 'Makanya, Mikir!: Panduan Berpikir untuk Hidup Lebih Bahagia',
      sapCode: 'BOK-MM-01',
      authorIds: ['author-abigail-limuria', 'author-cania-citta'],
      authors: [
        { id: 'author-abigail-limuria', name: 'Abigail Limuria', role: 'Penulis', biography: '', photoUrl: '' },
        { id: 'author-cania-citta', name: 'Cania Citta', role: 'Penulis', biography: '', photoUrl: '' }
      ],
      authorNames: 'Abigail Limuria & Cania Citta',
      isbn: '978-623-99812-4-2',
      categoryId: 'cat-buku-pemikiran',
      categoryName: 'Pengembangan Diri & Logika',
      price: 119000,
      compareAtPrice: 139000,
      description: 'Panduan kerangka berpikir (mental models) sistematis untuk membantu pembaca mengambil keputusan hidup secara jernih, bebas sesat pikir, dan terhindar dari keribetan yang tak perlu.',
      coverImage: '/images/books/makanya-mikir.jpg',
      publisher: 'Simpul / Malaka Books',
      publishedYear: 2025,
      pages: 296,
      weight: 350,
      stock: 45,
      averageRating: 4.9,
      totalReviews: 128,
      createdAt: new Date().toISOString(),
      additionalImages: [{ no: 1, image: '/images/books/makanya-mikir.jpg' }]
    } as Product;
  });

  readonly ekonomiProduct = computed(() => {
    const prods = this.productStore.products();
    const found = prods.find(p =>
      p.title.toLowerCase().includes('prinsipil') ||
      p.title.toLowerCase().includes('ekonomi')
    );
    if (found) return found;

    // Fallback default structure
    return {
      id: 'book-prinsipil-ekonomi',
      title: 'Prinsipil Ekonomi: Memahami Pilihan, Scarcity, dan Keputusan Hidup',
      sapCode: 'BOK-PE-02',
      authorIds: ['author-ferry-irwandi'],
      authors: [
        { id: 'author-ferry-irwandi', name: 'Ferry Irwandi', role: 'Penulis', biography: '', photoUrl: '' }
      ],
      authorNames: 'Ferry Irwandi',
      isbn: '978-623-99812-5-9',
      categoryId: 'cat-buku-ekonomi',
      categoryName: 'Ekonomi & Rasionalitas',
      price: 125000,
      compareAtPrice: 145000,
      description: 'Membongkar konsep dasar ekonomi seperti scarcity, opportunity cost, dan insentif dengan analogi budaya populer dan bahasa santai sehari-hari.',
      coverImage: '/images/books/prinsipil-ekonomi.jpg',
      publisher: 'Malaka Pustaka Pergerakan',
      publishedYear: 2026,
      pages: 267,
      weight: 320,
      stock: 38,
      averageRating: 4.9,
      totalReviews: 94,
      createdAt: new Date().toISOString(),
      additionalImages: [{ no: 1, image: '/images/books/prinsipil-ekonomi.jpg' }]
    } as Product;
  });

  toggleFaq(index: number) {
    this.openFaqIndex.update(cur => cur === index ? null : index);
  }

  setMikirTab(idx: number) {
    this.mikirActiveTab.set(idx);
  }

  setEkonomiTab(idx: number) {
    this.ekonomiActiveTab.set(idx);
  }

  setFeatureTab(idx: number) {
    this.activeFeatureTab.set(idx);
  }

  openVideoModal() {
    this.isVideoModalOpen.set(true);
  }

  closeVideoModal() {
    this.isVideoModalOpen.set(false);
  }

  nextTestimonial() {
    this.testimonialIndex.update(i => (i + 1) % 3);
  }

  prevTestimonial() {
    this.testimonialIndex.update(i => (i - 1 + 3) % 3);
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

  buyDirect(bookType: 'mikir' | 'ekonomi' | 'bundle') {
    if (bookType === 'bundle') {
      const bundle = this.productStore.products().find(p =>
        p.title.toLowerCase().includes('bundle') ||
        p.title.toLowerCase().includes('paket') ||
        (p.title.toLowerCase().includes('mikir') && p.title.toLowerCase().includes('ekonomi'))
      );
      if (bundle) {
        this.openQtyModal(bundle);
        return;
      }
      this.openQtyModal(this.mikirProduct());
      return;
    }
    const product = bookType === 'mikir' ? this.mikirProduct() : this.ekonomiProduct();
    this.openQtyModal(product);
  }

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

  readonly displayAuthors = computed(() => {
    const raw = this.authorStore.authors();
    if (raw.length === 0) return this.keyAuthors();
    return raw;
  });

  readonly displayBestSellers = computed(() => {
    const raw = this.productStore.products();
    if (raw.length > 0) return raw;
    return [this.mikirProduct(), this.ekonomiProduct()];
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

  readonly heroProducts = computed(() => {
    return [this.mikirProduct(), this.ekonomiProduct()];
  });

  isHeroFanned = signal<boolean>(false);

  ngOnInit() {
    this.seoService.updatePage({
      title: 'Malakabooks — Eksplorasi Buku "Makanya, Mikir!" & "Prinsipil Ekonomi"',
      description: 'Penjelasan mendalam dua karya literasi resmi: "Makanya, Mikir!" oleh Abigail Limuria & Cania Citta serta "Prinsipil Ekonomi" oleh Ferry Irwandi. Dapatkan buku fisik jahit benang orisinal.'
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

    setTimeout(() => {
      this.isHeroFanned.set(true);
    }, 200);
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

  openAuthorSheet(author: KeyAuthor) {
    this.selectedAuthor.set(author);
    this.selectedAuthorName.set(author.name || '');
    this.isAuthorSheetOpen.set(true);
  }

  closeAuthorSheet() {
    this.isAuthorSheetOpen.set(false);
  }
}
