import { Component, input, computed, ChangeDetectionStrategy, signal } from '@angular/core';
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
  readonly control = input<FormControl>(new FormControl());
  readonly id = input<string>('input-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly icon = input<string | undefined>(undefined);
  readonly customClass = input<string>('', { alias: 'class' });

  // Password toggle
  showPassword = signal<boolean>(false);

  togglePassword() {
    this.showPassword.update(s => !s);
  }

  readonly inputType = computed(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  // Compute styling based on states
  readonly inputClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 text-sm  focus:outline-none focus:ring-2 placeholder-slate-400 text-slate-800 bg-white';
    let padding = this.icon() ? 'pl-10 pr-4' : 'px-4';
    if (this.icon() && this.type() === 'password') {
      padding = 'pl-10 pr-10';
    } else if (this.type() === 'password') {
      padding = 'pl-4 pr-10';
    }

    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10';

    return `${base} ${padding} ${border} ${this.customClass()}`;
  });
}
