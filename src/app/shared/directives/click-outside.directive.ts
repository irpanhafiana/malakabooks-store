import { Directive, ElementRef, output, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef);
  readonly clickOutside = output<void>();

  @HostListener('document:click', ['$event.target'])
  onClick(target: any) {
    if (!target) return;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
