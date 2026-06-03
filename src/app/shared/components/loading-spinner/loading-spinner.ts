import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html'
})
export class LoadingSpinnerComponent {
  @Input() type: 'spinner' | 'skeleton' = 'spinner';
  @Input() layout: 'grid' | 'list' = 'grid';
  @Input() count = 4;
  @Input() message = 'Memuat data...';

  skeletonItems() {
    return Array(this.count).fill(0);
  }
}
