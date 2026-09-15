import { Directive, ElementRef, OnInit, OnDestroy, inject, input } from '@angular/core';

@Directive({
  selector: '[data-aos]',
  standalone: true
})
export class AosDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private observer: IntersectionObserver | undefined;
  
  // E.g. 'fade-up', 'fade-in', 'fade-left'
  dataAos = input<string>('', { alias: 'data-aos' });
  dataAosDelay = input<string>('0', { alias: 'data-aos-delay' });
  
  ngOnInit() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const element = this.el.nativeElement as HTMLElement;
    
    // Setup transition styles dynamically based on the animation type
    element.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    
    if (this.dataAosDelay() && this.dataAosDelay() !== '0') {
      element.style.transitionDelay = `${this.dataAosDelay()}ms`;
    }
    
    // Set initial state
    this.setInitialState(element);

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveState(element);
        } else {
          // This ensures it animates again when scrolling up or down
          this.setInitialState(element);
        }
      });
    }, {
      threshold: 0.05, // Trigger slightly earlier
      rootMargin: '0px 0px -50px 0px' 
    });

    this.observer.observe(element);
  }

  private setInitialState(element: HTMLElement) {
    const type = this.dataAos();
    element.style.opacity = '0';
    
    switch (type) {
      case 'fade-up':
        element.style.transform = 'translateY(40px)';
        break;
      case 'fade-down':
        element.style.transform = 'translateY(-40px)';
        break;
      case 'fade-left':
        element.style.transform = 'translateX(40px)'; // from right to left
        break;
      case 'fade-right':
        element.style.transform = 'translateX(-40px)'; // from left to right
        break;
      case 'zoom-in-up':
        element.style.transform = 'translateY(40px) scale(0.9)';
        break;
      default: // fade-in
        element.style.transform = 'translate(0, 0)';
        break;
    }
  }

  private setActiveState(element: HTMLElement) {
    element.style.opacity = '1';
    element.style.transform = 'translate(0, 0) scale(1)';
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
