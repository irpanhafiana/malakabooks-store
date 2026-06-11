import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
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
