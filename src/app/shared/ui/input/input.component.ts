import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class InputComponent {
  readonly control = input.required<FormControl>();
  readonly id = input<string>('input-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly icon = input<string | undefined>(undefined);
  readonly customClass = input<string>('', { alias: 'class' });

  // Compute styling based on states
  readonly inputClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 text-sm transition-all focus:outline-none focus:ring-2 placeholder-slate-400 text-slate-800 bg-white';
    const padding = this.icon() ? 'pl-10 pr-4' : 'px-4';
    
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10';

    return `${base} ${padding} ${border} ${this.customClass()}`;
  });
}
