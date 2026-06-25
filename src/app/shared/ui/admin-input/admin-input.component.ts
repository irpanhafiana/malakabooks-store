import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-input',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './admin-input.component.html'
})
export class AdminInputComponent {
  readonly control = input.required<FormControl>();
  readonly id = input<string>('admin-input-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly icon = input<string | undefined>(undefined);
  readonly customClass = input<string>('', { alias: 'class' });

  // Compute styling based on states
  readonly inputClass = computed(() => {
    // Admin uses smaller padding, standard text size, subtle borders
    const base = 'block w-full border rounded py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 placeholder-slate-400 text-slate-800 bg-white shadow-sm';
    const padding = this.icon() ? 'pl-9 pr-3' : 'px-3';
    
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500';

    return `${base} ${padding} ${border} ${this.customClass()}`;
  });
}
