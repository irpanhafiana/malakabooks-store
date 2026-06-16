import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStore } from '../../store/user.store';
import { CartStore } from '../../store/cart.store';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { MasonryGridComponent } from '../../shared/ui/masonry-grid/masonry-grid.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, EmptyStateComponent, MasonryGridComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
  protected readonly userStore = inject(UserStore);
  protected readonly cartStore = inject(CartStore);
}
