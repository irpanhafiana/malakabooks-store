import { Component, input, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';

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

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.renderComponent.set(true);
        setTimeout(() => {
          this.isAnimating.set(true);
        }, 16);
      } else {
        this.isAnimating.set(false);
        setTimeout(() => {
          this.renderComponent.set(false);
        }, 300);
      }
    });
  }

  closeSheet() {
    this.closed.emit();
  }
}
