import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-price',
  standalone: true,
  imports: [],
  templateUrl: './price.component.html',
  styleUrl: './price.component.css'
})
export class PriceComponent {
  readonly value = input.required<number>();
  readonly currencyCode = input<string>('USD');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly bold = input<boolean>(true);
  readonly customClass = input<string>('', { alias: 'class' });

  readonly formattedPrice = computed(() => {
    return 'Rp ' + Math.round(this.value()).toLocaleString('id-ID');
  });

  readonly priceClass = computed(() => {
    const fontSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base md:text-lg',
      xl: 'text-lg md:text-xl font-extrabold'
    };
    const fontWeight = this.bold() ? 'font-bold font-display text-slate-900' : 'text-slate-600';
    return `${fontSizes[this.size()]} ${fontWeight} ${this.customClass()}`;
  });
}
