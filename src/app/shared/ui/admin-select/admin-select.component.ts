import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-select.component.html'
})
export class AdminSelectComponent {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: any; label: string }[]>();
  readonly id = input<string>('admin-select-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly customClass = input<string>('', { alias: 'class' });

  readonly selectClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 pl-3 pr-9 text-sm focus:outline-none focus:ring-1 text-slate-800 bg-white appearance-none cursor-pointer';
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500';

    return `${base} ${border} ${this.customClass()}`;
  });
}
