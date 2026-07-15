import { Directive, Input, HostListener, ElementRef, ApplicationRef, EnvironmentInjector, createComponent, ComponentRef, inject, OnDestroy } from '@angular/core';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText = '';

  private componentRef: ComponentRef<TooltipComponent> | null = null;
  private el = inject(ElementRef);
  private appRef = inject(ApplicationRef);
  private environmentInjector = inject(EnvironmentInjector);

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.tooltipText) return;

    if (!this.componentRef) {
      this.componentRef = createComponent(TooltipComponent, {
        environmentInjector: this.environmentInjector
      });
      this.appRef.attachView(this.componentRef.hostView);
      document.body.appendChild(this.componentRef.location.nativeElement);
    }
    
    this.componentRef.instance.text.set(this.tooltipText);
    
    const { left, top, width } = this.el.nativeElement.getBoundingClientRect();
    
    // Wait for view update to get correct dimensions
    setTimeout(() => {
      if (!this.componentRef) return;
      const tooltipEl = this.componentRef.location.nativeElement.children[0];
      if (tooltipEl) {
        const tooltipWidth = tooltipEl.getBoundingClientRect().width;
        const tooltipHeight = tooltipEl.getBoundingClientRect().height;
        // Position above center
        this.componentRef.instance.left.set(left + (width - tooltipWidth) / 2);
        // adjust for scrolling
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.componentRef.instance.top.set(top + scrollTop - tooltipHeight - 8);
      }
    });
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
  
  ngOnDestroy() {
    this.onMouseLeave();
  }
}
