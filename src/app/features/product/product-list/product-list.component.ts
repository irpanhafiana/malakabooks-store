import { Component, inject, signal, effect } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { ProductCardComponent } from '../../../shared/ui/product-card/product-card.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { DrawerComponent } from '../../../shared/ui/drawer/drawer.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { MasonryGridComponent } from '../../../shared/ui/masonry-grid/masonry-grid.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ProductCardComponent, SkeletonComponent, IconComponent, DrawerComponent, EmptyStateComponent, MasonryGridComponent],
  template: `
    <div class="flex flex-col gap-5 animate-fade-in pb-12">
      <!-- Title & Search Meta header -->
      <div class="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h1 class="font-display font-extrabold text-slate-800 text-base">
            @if (productStore.searchQuery()) {
              Search: "{{ productStore.searchQuery() }}"
            } @else if (activeCategoryName()) {
              {{ activeCategoryName() }}
            } @else {
              Explore Collection
            }
          </h1>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ productStore.filteredProducts().length }} matching items</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Mobile filter button (always shown in mobile app style) -->
          <button
            type="button"
            (click)="openFilters()"
            class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-[10px] font-bold cursor-pointer active:scale-95 transition-all"
          >
            <app-icon name="filter" size="12"></app-icon>
            Filters
          </button>

          <!-- Sorting Select -->
          <div class="relative flex items-center">
            <select
              [value]="productStore.sortBy()"
              (change)="onSortChange($any($event.target).value)"
              class="border border-slate-200 bg-white text-slate-700 text-[10px] font-bold py-1.5 px-2.5 pr-7 rounded-xl focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <div class="absolute right-2.5 pointer-events-none text-slate-400 flex items-center">
              <i class="bx bx-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Layout Grid (Always 2 columns for mobile app) -->
      <div class="w-full">
        @if (productStore.loading()) {
          <div class="grid grid-cols-2 gap-4">
            <app-skeleton type="card" [count]="4"></app-skeleton>
          </div>
        } @else if (productStore.filteredProducts().length === 0) {
          <app-empty-state
            icon="book-open"
            title="No Products Found"
            description="We couldn't find any products matching your active filters. Try clearing your filters or changing your search term."
            actionText="Reset All Filters"
            (actionClick)="resetAllFilters()"
          ></app-empty-state>
        } @else {
          <app-masonry-grid [items]="productStore.filteredProducts()">
            <ng-template let-prod>
              <app-product-card
                [product]="prod"
                [isInWishlist]="userStore.isWishlisted(prod.id)"
                (addToCart)="cartStore.addItem($event)"
                (toggleWishlist)="userStore.toggleWishlist($event)"
              ></app-product-card>
            </ng-template>
          </app-masonry-grid>
        }
      </div>

      <!-- Mobile Filters Sheet Drawer (Kitabisa-style bottom-sheet) -->
      <app-drawer [(isOpen)]="isFiltersOpen" title="Filter Products" position="bottom">
        <div class="flex flex-col gap-6 py-2">
          <!-- Category selector -->
          <div>
            <h4 class="font-display font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Categories</h4>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="onCategorySelectMobile(null)"
                [class]="filterChipClass(null)"
              >
                All
              </button>
              @for (cat of productStore.categories(); track cat.id) {
                <button
                  type="button"
                  (click)="onCategorySelectMobile(cat.id)"
                  [class]="filterChipClass(cat.id)"
                >
                  {{ cat.name }}
                </button>
              }
            </div>
          </div>

          <hr class="border-slate-100" />
          
          <!-- Apply button -->
          <button
            type="button"
            (click)="closeFilters()"
            class="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/10 cursor-pointer text-center"
          >
            Apply Filters
          </button>
        </div>
      </app-drawer>

    </div>
  `
})
export class ProductListComponent {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);

  isFiltersOpen = signal<boolean>(false);
  activeCategoryName = signal<string | null>(null);

  constructor() {
    // React to category updates reactively using Angular signal effect
    effect(() => {
      this.updateActiveCategoryName();
    });
  }

  updateActiveCategoryName() {
    const catId = this.productStore.selectedCategoryId();
    if (catId) {
      const cat = this.productStore.categories().find(c => c.id === catId);
      this.activeCategoryName.set(cat ? cat.name : null);
    } else {
      this.activeCategoryName.set(null);
    }
  }

  onCategorySelect(catId: string | null) {
    this.productStore.setCategoryFilter(catId);
  }

  onCategorySelectMobile(catId: string | null) {
    this.productStore.setCategoryFilter(catId);
  }

  onSortChange(sortBy: any) {
    this.productStore.setSortBy(sortBy);
  }

  openFilters() {
    this.isFiltersOpen.set(true);
  }

  closeFilters() {
    this.isFiltersOpen.set(false);
  }

  resetAllFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
    this.productStore.setSortBy('featured');
  }

  filterButtonClass(catId: string | null): string {
    const base = 'w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer';
    const active = this.productStore.selectedCategoryId() === catId
      ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600'
      : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-4 border-transparent';
    return `${base} ${active}`;
  }

  filterChipClass(catId: string | null): string {
    const base = 'px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer';
    const active = this.productStore.selectedCategoryId() === catId
      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
    return `${base} ${active}`;
  }
}
