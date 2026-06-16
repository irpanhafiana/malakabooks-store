import { Component, input, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { Product } from '../../../core/models';
import { IconComponent } from '../icon/icon.component';
import { PriceComponent } from '../price/price.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { DiscountBadgeComponent } from '../discount-badge/discount-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-card',
  standalone: true,
  imports: [IconComponent, PriceComponent, RatingStarsComponent, DiscountBadgeComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  private readonly productStore = inject(ProductStore);

  readonly product = input.required<Product>();
  readonly isInWishlist = input<boolean>(false);
  
  readonly addToCart = output<Product>();
  readonly toggleWishlist = output<Product>();

  protected readonly Math = Math;
  protected readonly imageError = signal(false);

  onImageError() {
    this.imageError.set(true);
  }

  onAddToCart(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.addToCart.emit(this.product());
  }

  onToggleWishlist(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.toggleWishlist.emit(this.product());
  }

  viewProductDetails() {
    this.productStore.setSelectedProductId(this.product().id);
  }
}
