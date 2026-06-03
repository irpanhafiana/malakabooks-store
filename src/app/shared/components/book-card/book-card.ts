import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Book } from '../../../core/models/book.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../toast/toast.service';
import { CurrencyRupiahPipe } from '../../pipes/currency.pipe';
import { StarRatingComponent } from '../star-rating/star-rating';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyRupiahPipe, StarRatingComponent],
  templateUrl: './book-card.html'
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;
  @Input() aspectRatio: '3/4' | 'square' = '3/4';
  @Input() roundedClass = 'rounded-2xl';
  @Input() paddingClass = 'p-4';
  @Input() ratingStyle: 'stars' | 'badge' = 'stars';
  @Input() minTitleHeightClass = 'min-h-[2.5rem]';

  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);

  onQuickAdd(event: MouseEvent) {
    event.stopPropagation(); // Prevent card router link click
    if (this.book.stock > 0) {
      this.cartService.addItem(this.book.id);
      this.toastService.showSuccess(`"${this.book.title}" berhasil ditambahkan ke keranjang.`);
    }
  }
}
