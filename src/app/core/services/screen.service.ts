import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenService implements OnDestroy {
  readonly isDesktop = signal<boolean>(false);
  private mediaQueryList: MediaQueryList;
  private listener: (e: MediaQueryListEvent) => void;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQueryList = window.matchMedia('(min-width: 1024px)');
      
      // Initialize with current value
      this.isDesktop.set(this.mediaQueryList.matches);
      
      // Setup listener
      this.listener = (e: MediaQueryListEvent) => {
        this.isDesktop.set(e.matches);
      };
      
      if (this.mediaQueryList.addEventListener) {
        this.mediaQueryList.addEventListener('change', this.listener);
      }
    } else {
       this.mediaQueryList = {} as MediaQueryList;
       this.listener = () => {};
    }
  }

  ngOnDestroy() {
    if (this.mediaQueryList && this.mediaQueryList.removeEventListener) {
        this.mediaQueryList.removeEventListener('change', this.listener);
    }
  }
}
