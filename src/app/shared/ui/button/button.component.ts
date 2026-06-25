import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input<boolean>(false);
  readonly customClass = input<string>('', { alias: 'class' });

  // Dynamically compute the Tailwind classes for styling
  readonly buttonClass = computed(() => {
    const base = 'inline-flex items-center justify-center font-semibold   rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-center';

    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/10 focus:ring-primary-500 border border-transparent',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300 border border-transparent',
      accent: 'bg-accent-600 hover:bg-accent-700 text-white shadow-md shadow-accent-600/10 focus:ring-accent-500 border border-transparent',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 focus:ring-rose-500 border border-transparent',
      outline: 'bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300 border border-transparent'
    };

    const sizes = {
      sm: 'py-2 px-3 text-xs rounded-lg',
      md: 'py-2.5 px-4 text-sm',
      lg: 'py-3.5 px-6 text-base rounded-2xl'
    };

    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]} ${width} ${this.customClass()}`;
  });
}
