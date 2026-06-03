import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WriteReviewPage } from './write-review';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-write-review-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './write-review-desktop.html'
})
export class WriteReviewDesktopComponent {
  parent = input.required<WriteReviewPage>();
}
