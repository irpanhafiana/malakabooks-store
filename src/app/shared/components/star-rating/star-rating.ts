import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html'
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() readOnly = true;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() showText = false;

  @Output() ratingChange = new EventEmitter<number>();

  onStarClick(ratingValue: number) {
    if (!this.readOnly) {
      this.rating = ratingValue;
      this.ratingChange.emit(ratingValue);
    }
  }
}
