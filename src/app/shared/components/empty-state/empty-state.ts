import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.html'
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
  @Input() icon: 'cart' | 'search' | 'orders' | 'address' = 'search';
  @Input() actionText = '';
  @Input() actionLink = '';
  @Input() actionParams: any = null;

  @Output() actionClick = new EventEmitter<void>();

  onAction() {
    this.actionClick.emit();
  }
}
