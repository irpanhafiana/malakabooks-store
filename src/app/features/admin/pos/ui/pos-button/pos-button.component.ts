import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type PosButtonVariant =
  | 'primary' | 'success' | 'danger' | 'warning' | 'outline'
  | 'ghost' | 'soft-danger' | 'soft-primary' | 'secondary';
export type PosButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Tombol POS. API identik dengan `app-button` sj-pos.
 *
 * Peta warna ke tema malakabooks:
 *  - primary  : biru  → primary-600 (#FE7743)
 *  - danger   : merah → accent-600 (#B61919)
 *  - success  : emerald DIPERTAHANKAN — kode semantik "produk siap" di kasir
 *  - warning  : kuning DIPERTAHANKAN — kode semantik "tunda / tambahan"
 */
@Component({
  selector: 'app-pos-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pos-button.component.html',
  host: {
    '[class.w-full]': 'block()',
    '[class.inline-block]': '!block()'
  }
})
export class PosButtonComponent {
  variant = input<PosButtonVariant>('primary');
  size = input<PosButtonSize>('md');
  block = input<boolean>(false);
  active = input<boolean>(false);
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  routerLink = input<string | any[] | null>(null);
  href = input<string | null>(null);
  icon = input<string>('');
  iconClass = input<string>('');
  label = input<string>('');
  customClass = input<string>('');

  buttonClasses = computed(() => {
    const baseClasses = 'relative group inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none border-2 focus:ring-4';

    const sizeClasses = {
      'xs': 'h-7 px-2.5 text-2xs rounded-lg gap-1',
      'sm': 'h-9 px-4 text-xs rounded-xl gap-1.5',
      'md': 'h-11 px-5 text-sm rounded-xl gap-2',
      'lg': 'h-14 px-6 text-sm rounded-2xl gap-2'
    }[this.size()];

    let variantClasses = {
      'primary': 'bg-primary-600 border-primary-700 text-white hover:bg-primary-700 hover:border-primary-800 focus:ring-primary-600/30',
      'success': 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 hover:border-emerald-700 focus:ring-emerald-500/30',
      'danger': 'bg-accent-600 border-accent-700 text-white hover:bg-accent-700 hover:border-accent-800 focus:ring-accent-600/30',
      'warning': 'bg-amber-400 border-amber-500 text-slate-900 hover:bg-amber-500 hover:border-amber-600 focus:ring-amber-400/30',
      'secondary': 'bg-slate-600 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-800 focus:ring-slate-600/30',
      'outline': 'bg-white border-slate-200 text-slate-600 hover:border-primary-600 hover:text-primary-600 focus:ring-primary-600/20',
      'ghost': 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:ring-slate-200/50',
      'soft-danger': 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100 hover:border-rose-200 focus:ring-rose-600/20',
      'soft-primary': 'bg-primary-50 border-primary-100 text-primary-600 hover:bg-primary-100 hover:border-primary-200 focus:ring-primary-600/20',
    }[this.variant()];

    if (this.active() && this.variant() === 'outline') {
      variantClasses = 'bg-primary-50 border-primary-600 text-primary-700 focus:ring-primary-600/30';
    }

    const blockClass = this.block() ? 'w-full flex' : '';

    return `${baseClasses} ${sizeClasses} ${variantClasses} ${blockClass} ${this.customClass()}`.trim();
  });
}
