import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css'
})
export class SelectComponent {
  readonly control = input.required<FormControl>();
  readonly options = input.required<{ value: string | number | boolean | unknown; label: string }[]>();
  readonly id = input<string>('select-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly customClass = input<string>('');

  readonly selectClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 pl-4 pr-10 text-sm  focus:outline-none focus:ring-2 text-slate-800 bg-white appearance-none cursor-pointer';
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10';

    return `${base} ${border} ${this.customClass()}`;
  });
}
