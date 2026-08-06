import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-search-input',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="relative w-full">
      <app-icon name="search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></app-icon>
      <input
        type="text"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        class="w-full pl-10 pr-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-600"
      >
    </div>
  `
})
export class AdminSearchInputComponent {
  readonly value = input<string>('');
  readonly placeholder = input<string>('Cari...');
  readonly valueChange = output<string>();

  protected onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
