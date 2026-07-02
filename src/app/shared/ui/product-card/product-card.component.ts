import { Component, input, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { Product } from '../../../core/models';
import { IconComponent } from '../icon/icon.component';
import { PriceComponent } from '../price/price.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-card',
  standalone: true,
  imports: [IconComponent, PriceComponent],

  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  private readonly productStore = inject(ProductStore);

  readonly product = input.required<Product>();

  readonly addToCart = output<Product>();

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

  viewProductDetails() {
    this.productStore.setSelectedProductId(this.product().id);
  }
}
