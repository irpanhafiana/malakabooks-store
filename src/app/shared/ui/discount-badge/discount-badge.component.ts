import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-discount-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discount-badge.component.html',
  styleUrl: './discount-badge.component.css'
})
export class DiscountBadgeComponent {
  readonly price = input.required<number>();
  readonly originalPrice = input<number | undefined>(undefined);
  readonly size = input<'sm' | 'md'>('sm');
  readonly customClass = input<string>('', { alias: 'class' });

  readonly discountPercentage = computed(() => {
    const orig = this.originalPrice();
    const pr = this.price();
    if (!orig || orig <= pr) return 0;
    return Math.round(((orig - pr) / orig) * 100);
  });

  readonly hasDiscount = computed(() => this.discountPercentage() > 0);

  readonly badgeClass = computed(() => {
    const sizeClasses = this.size() === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
    return `font-bold bg-rose-500 text-white rounded-lg select-none transition-all ${sizeClasses} ${this.customClass()}`;
  });
}
