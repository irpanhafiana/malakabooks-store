import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly type = input<'order' | 'complaint'>('order');

  readonly variant = computed(() => {
    const s = this.status().toLowerCase();
    if (this.type() === 'complaint') {
      const map: Record<string, 'secondary' | 'success' | 'warning' | 'danger'> = {
        open: 'warning',
        in_progress: 'secondary',
        resolved: 'success',
        closed: 'secondary'
      };
      return map[s] ?? 'secondary';
    } else {
      if (s === 'completed' || s === 'success') return 'success';
      if (s === 'shipped') return 'accent';
      if (s === 'processing') return 'info';
      if (s === 'pending') return 'warning';
      return 'danger';
    }
  });

  readonly label = computed(() => {
    const s = this.status();
    if (this.type() === 'complaint') {
      const map: Record<string, string> = {
        open: 'Terbuka',
        in_progress: 'Diproses',
        resolved: 'Selesai',
        closed: 'Ditutup'
      };
      return map[s.toLowerCase()] ?? s;
    } else {
      return s.toUpperCase();
    }
  });
}
