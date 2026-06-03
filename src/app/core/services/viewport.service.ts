import { Injectable, signal, computed, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  
  // Tailwind default 'lg' breakpoint threshold is 1024px
  private readonly mobileThreshold = 1024;
  
  private readonly screenWidth = signal<number>(1024);

  readonly isMobile = computed(() => this.screenWidth() < this.mobileThreshold);
  readonly isDesktop = computed(() => this.screenWidth() >= this.mobileThreshold);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth.set(window.innerWidth);
      
      this.zone.runOutsideAngular(() => {
        window.addEventListener('resize', () => {
          if (this.screenWidth() !== window.innerWidth) {
            this.zone.run(() => {
              this.screenWidth.set(window.innerWidth);
            });
          }
        });
      });
    }
  }
}
