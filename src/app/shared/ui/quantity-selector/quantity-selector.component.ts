import { Component, input, model, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.css'
})
export class QuantitySelectorComponent {
  readonly quantity = model.required<number>();
  readonly min = input<number>(1);
  readonly max = input<number>(9999);
  readonly stock = input<number>(9999);
  readonly disabled = input<boolean>(false);
  readonly variant = input<'sm' | 'md'>('md');
  readonly customClass = input<string>('');

  readonly effectiveMax = computed(() => {
    return Math.min(this.max(), this.stock());
  });

  readonly containerClass = computed(() => {
    const base = 'flex items-center border border-slate-200 overflow-hidden';
    const variantClasses = this.variant() === 'md'
      ? 'bg-slate-50/30 rounded-xl h-11 shrink-0'
      : 'bg-white rounded-lg h-auto';
    return `${base} ${variantClasses} ${this.customClass()}`;
  });

  readonly buttonClass = computed(() => {
    return this.variant() === 'md'
      ? 'px-2.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer active:scale-95  outline-none h-full flex items-center'
      : 'p-1.5 text-slate-500 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none flex items-center';
  });

  decrement() {
    if (this.disabled()) return;
    const current = this.quantity();
    if (current > this.min()) {
      this.quantity.set(current - 1);
    }
  }

  increment() {
    if (this.disabled()) return;
    const current = this.quantity();
    if (current < this.effectiveMax()) {
      this.quantity.set(current + 1);
    }
  }
}
