import { Component, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="id()" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{{ label() }}</label>
      }
      <div class="relative rounded-xl">
        @if (icon()) {
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <app-icon [name]="icon()!" size="18" class="text-slate-400"></app-icon>
          </div>
        }
        <input
          [id]="id()"
          [type]="type()"
          [placeholder]="placeholder()"
          [formControl]="control()"
          [class]="inputClass()"
        />
      </div>
      @if (control().invalid && (control().dirty || control().touched)) {
        <span class="text-rose-500 text-xs mt-1.5 block animate-fade-in">
          @if (control().errors?.['required']) { Field is required. }
          @else if (control().errors?.['email']) { Please enter a valid email. }
          @else if (control().errors?.['minlength']) { Must be at least {{ control().errors?.['minlength']?.requiredLength }} characters. }
          @else { Input is invalid. }
        </span>
      }
    </div>
  `
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
