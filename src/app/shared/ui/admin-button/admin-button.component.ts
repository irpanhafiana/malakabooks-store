import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-button',
  standalone: true,
  templateUrl: './admin-button.component.html'
})
export class AdminButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'>('primary');
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input<boolean>(false);
  readonly customClass = input<string>('', { alias: 'class' });

  // Dynamically compute the Tailwind classes for styling (denser than customer button)
  readonly buttonClass = computed(() => {
    const base = 'inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      primary: 'bg-linear-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white focus:ring-primary-500 border border-transparent shadow-sm hover:shadow-md',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-300 border border-transparent',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent ',
      outline: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-300 ',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200 border border-transparent'
    };

    const sizes = {
      xs: 'py-1 px-2 text-xs',
      sm: 'py-1.5 px-3 text-sm',
      md: 'py-2 px-4 text-sm',
      lg: 'py-2.5 px-5 text-base'
    };

    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]} ${width} ${this.customClass()}`;
  });
}
