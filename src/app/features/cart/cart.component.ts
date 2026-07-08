import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../store/cart.store';
import { ProductStore } from '../../store/product.store';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { QuantitySelectorComponent } from '../../shared/ui/quantity-selector/quantity-selector.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, ButtonComponent, EmptyStateComponent, QuantitySelectorComponent],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
}
