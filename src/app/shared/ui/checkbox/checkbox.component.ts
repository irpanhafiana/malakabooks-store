import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <label class="inline-flex items-start gap-3 cursor-pointer group select-none">
      <div class="relative flex items-center mt-0.5">
        <input
          type="checkbox"
          [id]="id()"
          [formControl]="control()"
          class="peer sr-only"
        />
        <!-- Custom styled checkbox body -->
        <div class="h-5 w-5 rounded-md border border-slate-200 bg-white transition-all peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30"></div>
        <i class="bx bx-check absolute text-white text-xs scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none"></i>
      </div>
      @if (label()) {
        <span class="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{{ label() }}</span>
      }
    </label>
  `
})
export class CheckboxComponent {
  readonly control = input.required<FormControl>();
  readonly id = input<string>('checkbox-' + Math.random().toString(36).substring(2, 9));
  readonly label = input<string>('');
}
