import { Injectable, signal, computed, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenService implements OnDestroy {
  readonly isDesktop = signal<boolean>(false);
  readonly isTablet = signal<boolean>(false);
  readonly isMobile = signal<boolean>(false);
  readonly isHandheld = computed(() => !this.isDesktop());

  private desktopMql?: MediaQueryList;
  private tabletMql?: MediaQueryList;
  private mobileMql?: MediaQueryList;

  private desktopListener?: (e: MediaQueryListEvent) => void;
  private tabletListener?: (e: MediaQueryListEvent) => void;
  private mobileListener?: (e: MediaQueryListEvent) => void;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.desktopMql = window.matchMedia('(min-width: 1024px)');
      this.tabletMql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      this.mobileMql = window.matchMedia('(max-width: 767px)');

      this.isDesktop.set(this.desktopMql.matches);
      this.isTablet.set(this.tabletMql.matches);
      this.isMobile.set(this.mobileMql.matches);

      this.desktopListener = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
      this.tabletListener = (e: MediaQueryListEvent) => this.isTablet.set(e.matches);
      this.mobileListener = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);

      this.desktopMql.addEventListener?.('change', this.desktopListener);
      this.tabletMql.addEventListener?.('change', this.tabletListener);
      this.mobileMql.addEventListener?.('change', this.mobileListener);
    }
  }

  ngOnDestroy() {
    if (this.desktopMql && this.desktopListener) {
      this.desktopMql.removeEventListener?.('change', this.desktopListener);
    }
    if (this.tabletMql && this.tabletListener) {
      this.tabletMql.removeEventListener?.('change', this.tabletListener);
    }
    if (this.mobileMql && this.mobileListener) {
      this.mobileMql.removeEventListener?.('change', this.mobileListener);
    }
  }
}
