import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStore } from '../../store/user.store';
import { CartStore } from '../../store/cart.store';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { MasonryGridComponent } from '../../shared/ui/masonry-grid/masonry-grid.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, EmptyStateComponent, MasonryGridComponent],
  template: `
    <div class="animate-fade-in pb-12">
      <h1 class="font-display font-extrabold text-slate-800 text-base mb-4">My Wishlist</h1>

      @if (userStore.wishlistCount() === 0) {
        <app-empty-state
          icon="heart"
          title="Wishlist is Empty"
          description="You haven't saved any items to your wishlist yet. Tap the heart icon on any product to save it here for later!"
          actionText="Explore Products"
          routerLink="/product"
        ></app-empty-state>
      } @else {
        <app-masonry-grid [items]="userStore.wishlist()">
          <ng-template let-item>
            <app-product-card
              [product]="item.product"
              [isInWishlist]="true"
              (addToCart)="cartStore.addItem($event)"
              (toggleWishlist)="userStore.toggleWishlist($event)"
            ></app-product-card>
          </ng-template>
        </app-masonry-grid>
      }
    </div>
  `
})
export class WishlistComponent {
  protected readonly userStore = inject(UserStore);
  protected readonly cartStore = inject(CartStore);
}
