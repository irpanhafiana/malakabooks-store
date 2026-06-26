import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, ChangeDetectionStrategy } from '@angular/core';
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SkeletonComponent, IconComponent, MasonryGridComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);

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

  private embla?: EmblaCarouselType;

  @ViewChild('carouselViewport') carouselViewport!: ElementRef<HTMLElement>;

  ngOnInit() {
    this.productStore.loadAll();
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    this.embla = EmblaCarousel(
      this.carouselViewport.nativeElement,
      { loop: true, align: 'center', duration: 40 },
      [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onSelect = () => this.currentSlide.set(this.embla!.selectedScrollSnap());
    this.embla.on('select', onSelect);
    onSelect();
  }

  ngOnDestroy() {
    this.embla?.destroy();
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
}
