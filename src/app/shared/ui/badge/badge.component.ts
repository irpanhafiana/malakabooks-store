import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  readonly variant = input<'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>('secondary');
  readonly size = input<'sm' | 'md'>('md');
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly customClass = input<string>('', { alias: 'class' });

  readonly badgeClass = computed(() => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-full leading-none tracking-wide text-center';
    
    const variants = {
      primary: 'bg-primary-50 text-primary-700 border border-primary-100',
      secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
      accent: 'bg-accent-50 text-accent-700 border border-accent-100',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      warning: 'bg-amber-50 text-amber-700 border border-amber-100',
      danger: 'bg-rose-50 text-rose-700 border border-rose-100',
      info: 'bg-sky-50 text-sky-700 border border-sky-100'
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs'
    };

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]} ${this.customClass()}`;
  });
}
