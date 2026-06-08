import { Component, input, output, inject } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { Product } from '../../../core/models';
import { IconComponent } from '../icon/icon.component';
import { PriceComponent } from '../price/price.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [IconComponent, PriceComponent],
  template: `
    @let prod = product();
    <div class="group relative bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all duration-200 flex flex-col justify-between h-full">
      <!-- Wishlist Heart Overlay button (Perfect circle wrapper) -->
      <button
        type="button"
        (click)="onToggleWishlist($event)"
        class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border-0 p-0 outline-none shadow-sm hover:shadow text-slate-400 hover:text-rose-500 transition-all cursor-pointer active:scale-90 flex items-center justify-center aspect-square flex-shrink-0"
      >
        <app-icon [name]="isInWishlist() ? 'heart-filled' : 'heart'" size="16" [class]="isInWishlist() ? 'text-rose-500' : 'text-slate-400'"></app-icon>
      </button>

      <!-- Clickable details container -->
      <div (click)="viewProductDetails()" class="block flex-grow cursor-pointer">
        <!-- Image Container -->
        <div class="aspect-square w-full bg-slate-50 rounded-xl overflow-hidden mb-3 relative">
          <img
            [src]="prod.images[0]"
            [alt]="prod.name"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          @if (prod.originalPrice && prod.originalPrice > prod.price) {
            <span class="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-lg">
              Save {{ Math.round(((prod.originalPrice - prod.price)/prod.originalPrice) * 100) }}%
            </span>
          }
        </div>

        <!-- Meta info -->
        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{{ prod.categoryName }}</span>
        
        <!-- Title -->
        <h3 class="text-sm font-semibold text-slate-800 line-clamp-2 mb-1.5 group-hover:text-primary-600 transition-colors h-10">{{ prod.name }}</h3>
        
        <!-- Ratings -->
        <div class="flex items-center gap-1 mb-2">
          <app-icon name="star" size="12" class="text-amber-400 fill-amber-400"></app-icon>
          <span class="text-xs font-semibold text-slate-700">{{ prod.rating }}</span>
          <span class="text-[10px] text-slate-400">({{ prod.reviewsCount }})</span>
        </div>
      </div>

      <!-- Pricing and Add to Cart action -->
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <div class="flex flex-col">
          @if (prod.originalPrice && prod.originalPrice > prod.price) {
            <span class="text-[10px] text-slate-400 line-through leading-none mb-0.5">$ {{ prod.originalPrice }}</span>
          }
          <app-price [value]="prod.price" size="md" class="text-primary-600"></app-price>
        </div>

        <button
          type="button"
          (click)="onAddToCart($event)"
          class="p-2 rounded-xl bg-primary-50 hover:bg-primary-600 text-primary-600 hover:text-white transition-all cursor-pointer active:scale-95 border border-primary-100 hover:border-transparent"
        >
          <app-icon name="shopping-cart" size="18"></app-icon>
        </button>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  private readonly productStore = inject(ProductStore);

  readonly product = input.required<Product>();
  readonly isInWishlist = input<boolean>(false);
  
  readonly addToCart = output<Product>();
  readonly toggleWishlist = output<Product>();

  protected readonly Math = Math;

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
