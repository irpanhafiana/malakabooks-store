import { Component, input, output, effect, signal, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bottom-sheet',
  standalone: true,
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.css'
})
export class BottomSheetComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  
  readonly closed = output<void>();

  renderComponent = signal<boolean>(false);
  isAnimating = signal<boolean>(false);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.renderComponent.set(true);
        // Force evaluation in next microtask to allow DOM to render before animating
        Promise.resolve().then(() => {
          this.isAnimating.set(true);
          this.cdr.markForCheck();
        });
      } else {
        this.isAnimating.set(false);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.renderComponent.set(false);
          this.cdr.markForCheck();
        }, 300);
      }
    });
  }

  closeSheet() {
    this.closed.emit();
  }
}
