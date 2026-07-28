import { Component, input, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { AuthStore } from '../../../store/auth.store';
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
  protected readonly authStore = inject(AuthStore);

  readonly product = input.required<Product>();
  readonly customClick = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('sm');

  readonly addToCart = output<Product>();
  readonly productClick = output<Product>();

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
    if (this.customClick()) {
      this.productClick.emit(this.product());
    } else {
      this.productStore.setSelectedProductId(this.product().id);
    }
  }
}
