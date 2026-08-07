import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-katalog-quantity-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './katalog-quantity-selector.component.html'
})
export class KatalogQuantitySelectorComponent {
  quantity = input<number>(1);
  min = input<number>(1);
  max = input<number>(999);
  size = input<'sm' | 'md'>('md');

  changeQty = output<number>();

  decrement() {
    if (this.quantity() > this.min()) {
      this.changeQty.emit(this.quantity() - 1);
    }
  }

  increment() {
    if (this.quantity() < this.max()) {
      this.changeQty.emit(this.quantity() + 1);
    }
  }

  getButtonClass(): string {
    return this.size() === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm';
  }

  getIconClass(): string {
    return this.size() === 'sm' ? 'text-sm' : 'text-base';
  }

  getTextClass(): string {
    return this.size() === 'sm' ? 'px-3 py-2 text-base min-w-9' : 'px-4 py-2.5 text-base min-w-12';
  }
}
