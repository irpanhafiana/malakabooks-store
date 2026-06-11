import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CartStore } from '../../store/cart.store';
import { ProductStore } from '../../store/product.store';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { InputComponent } from '../../shared/ui/input/input.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PriceComponent, IconComponent, ButtonComponent, EmptyStateComponent, InputComponent, DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);

  promoControl = new FormControl('');

  applyPromo() {
    const code = this.promoControl.value || '';
    if (code) {
      const success = this.cartStore.applyPromo(code);
      if (success) {
        this.promoControl.reset();
      }
    }
  }
}
