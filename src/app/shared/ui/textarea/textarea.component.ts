import { Component, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.css'
})
export class TextareaComponent {
  readonly control = input.required<FormControl>();
  readonly id = input<string>('textarea-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly rows = input<number>(3);
  readonly customClass = input<string>('', { alias: 'class' });

  readonly textareaClass = computed(() => {
    const base = 'block w-full border rounded-xl py-2.5 px-4 text-sm transition-all focus:outline-none focus:ring-2 placeholder-slate-400 text-slate-800 bg-white resize-y';
    const isError = this.control().invalid && (this.control().dirty || this.control().touched);
    const border = isError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/10';

    return `${base} ${border} ${this.customClass()}`;
  });
}
