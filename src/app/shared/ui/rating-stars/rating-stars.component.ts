import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.css'
})
export class RatingStarsComponent {
  readonly rating = input.required<number>();
  readonly reviewsCount = input<number | undefined>(undefined);
  readonly showText = input<boolean>(true);
  readonly starSize = input<number | string>(14);
  readonly reviewsSuffix = input<string>('');

  readonly stars = computed(() => {
    const list: ('full' | 'half' | 'empty')[] = [];
    const r = this.rating();
    for (let i = 1; i <= 5; i++) {
      if (r >= i) {
        list.push('full');
      } else if (r >= i - 0.5) {
        list.push('half');
      } else {
        list.push('empty');
      }
    }
    return list;
  });
}
