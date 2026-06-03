import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html'
})
export class BadgeComponent {
  @Input() type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
  @Input() size: 'xs' | 'sm' = 'xs';
}
