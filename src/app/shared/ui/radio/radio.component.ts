import { Component, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-2.5">
      @if (label()) {
        <span class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{{ label() }}</span>
      }
      <div [class]="directionClass()">
        @for (opt of options(); track opt.value) {
          <label class="inline-flex items-center gap-3 cursor-pointer select-none group">
            <div class="relative flex items-center">
              <input
                type="radio"
                [name]="name()"
                [value]="opt.value"
                [formControl]="control()"
                class="peer sr-only"
              />
              <!-- Custom radio selector outer ring and inner dot -->
              <div class="h-5 w-5 rounded-full border border-slate-200 bg-white transition-all peer-checked:border-primary-600 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30">
                <div class="h-2.5 w-2.5 rounded-full bg-primary-600 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
              </div>
            </div>
            <span class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{{ opt.label }}</span>
          </label>
        }
      </div>
    </div>
  `
})
export class RadioComponent {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: any; label: string }[]>();
  readonly name = input<string>('radio-group-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly direction = input<'row' | 'col'>('col');

  readonly directionClass = computed(() => {
    return this.direction() === 'row' ? 'flex flex-row flex-wrap gap-6' : 'flex flex-col gap-3.5';
  });
}
