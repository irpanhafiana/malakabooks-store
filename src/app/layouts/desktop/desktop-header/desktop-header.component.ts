import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { CartStore } from '../../../store/cart.store';
import { ProductStore } from '../../../store/product.store';
import { getBffLoginUrl } from '../../../core/auth/login-url.util';

@Component({
  selector: 'app-desktop-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './desktop-header.component.html',
  styleUrl: './desktop-header.component.css',
  host: {
    'class': 'block h-20 w-full z-50'
  }
})
export class DesktopHeaderComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly loginUrl = getBffLoginUrl('/');

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
  }
}
