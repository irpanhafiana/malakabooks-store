import { Component, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="id()" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{{ label() }}</label>
      }
      <div class="relative">
        <select
          [id]="id()"
          [formControl]="control()"
          [class]="selectClass()"
        >
          @if (placeholder()) {
            <option value="" disabled selected>{{ placeholder() }}</option>
          }
          @for (opt of options(); track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <!-- Custom Chevron Down arrow for custom select element -->
        <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <i class="bx bx-chevron-down text-sm"></i>
        </div>
      </div>
      @if (control().invalid && (control().dirty || control().touched)) {
        <span class="text-rose-500 text-xs mt-1.5 block animate-fade-in">
          @if (control().errors?.['required']) { Selection is required. }
        </span>
      }
    </div>
  `
})
export class SelectComponent {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: any; label: string }[]>();
  readonly id = input<string>('select-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly customClass = input<string>('', { alias: 'class' });

  readonly selectClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 pl-4 pr-10 text-sm transition-all focus:outline-none focus:ring-2 text-slate-800 bg-white appearance-none cursor-pointer';
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10';

    return `${base} ${border} ${this.customClass()}`;
  });
}
