import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookDetailPage } from './book-detail';
import { BookCardComponent } from '../../../shared/components/book-card/book-card';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../shared/components/button/button';

@Component({
  selector: 'app-book-detail-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    BookCardComponent,
    StarRatingComponent,
    LoadingSpinnerComponent,
    CurrencyRupiahPipe,
    BadgeComponent,
    ButtonComponent
  ],
  templateUrl: './book-detail-mobile.html'
})
export class BookDetailMobileComponent {
  parent = input.required<BookDetailPage>();
}
