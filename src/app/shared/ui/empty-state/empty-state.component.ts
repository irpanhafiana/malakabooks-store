import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent, ButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 py-12 max-w-md mx-auto w-full">
      <div class="p-4 rounded-full bg-slate-100 text-slate-400 mb-4 animate-scale-in">
        <app-icon [name]="icon()" size="36"></app-icon>
      </div>
      <h3 class="font-display font-semibold text-slate-800 text-base mb-1.5">{{ title() }}</h3>
      <p class="text-xs text-slate-500 mb-6 leading-relaxed px-4">{{ description() }}</p>
      
      @if (actionText()) {
        <app-button variant="primary" size="sm" (click)="onActionClick()">
          {{ actionText() }}
        </app-button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  readonly icon = input<string>('book-open');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionText = input<string | undefined>(undefined);
  readonly actionClick = output<void>();

  onActionClick() {
    this.actionClick.emit();
  }
}
