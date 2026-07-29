import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { CartStore } from '../../../store/cart.store';
import { ProductStore } from '../../../store/product.store';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar.component';

@Component({
  selector: 'app-desktop-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SearchBarComponent],
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
  private readonly router = inject(Router);

  onSearch(query: string) {
    this.productStore.setSearchQuery(query);
    this.router.navigate(['/product']);
  }

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
  }
}
