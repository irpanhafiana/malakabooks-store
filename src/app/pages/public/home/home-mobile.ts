import { Component, input, OnInit, OnDestroy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomePage } from './home';
import { BookCardComponent } from '../../../shared/components/book-card/book-card';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-home-mobile',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCardComponent, LoadingSpinnerComponent],
  templateUrl: './home-mobile.html'
})
export class HomeMobileComponent implements OnInit, OnDestroy {
  parent = input.required<HomePage>();

  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLDivElement>;

  currentSlide = signal(0);
  private autoSlideInterval?: any;

  slides = [
    {
      title: 'Selamat Datang di Malaka Books',
      description: 'Koleksi buku fisik premium terlengkap, kurasi sastra pilihan langsung ke rumah Anda.',
      bgGradient: 'from-stone-950 to-amber-950/80',
      actionText: 'Jelajahi Koleksi',
      actionLink: '/catalog',
      image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400'
    },
    {
      title: 'Edisi Spesial & Rilisan Terbaru',
      description: 'Dapatkan buku fisik premium terhangat dengan kualitas cetak dan kemasan terbaik.',
      bgGradient: 'from-stone-950 to-emerald-950/80',
      actionText: 'Lihat Rilisan Baru',
      actionLink: '/catalog',
      actionParams: { sort: 'latest' },
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    },
    {
      title: 'Bebas Ongkir & Bubble Wrap Tebal',
      description: 'Jaminan pengiriman aman terlindungi dengan packaging khusus standar Malaka Books.',
      bgGradient: 'from-stone-950 to-stone-900',
      actionText: 'Mulai Belanja',
      actionLink: '/catalog',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400'
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide() {
    const nextIndex = (this.currentSlide() + 1) % this.slides.length;
    this.currentSlide.set(nextIndex);
    this.scrollToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentSlide() - 1 + this.slides.length) % this.slides.length;
    this.currentSlide.set(prevIndex);
    this.scrollToSlide(prevIndex);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.scrollToSlide(index);
    this.startAutoSlide(); // Reset interval
  }

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el && el.clientWidth > 0) {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      if (this.currentSlide() !== index) {
        this.currentSlide.set(index);
      }
    }
  }

  private scrollToSlide(index: number) {
    const el = this.carouselContainer?.nativeElement;
    if (el && el.clientWidth > 0) {
      el.scrollTo({
        left: index * el.clientWidth,
        behavior: 'smooth'
      });
    }
  }
}
