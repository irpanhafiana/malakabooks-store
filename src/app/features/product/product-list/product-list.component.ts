import { Component, inject, signal, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ProductStore } from '../../../store/product.store';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { Product } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { DrawerComponent } from '../../../shared/ui/drawer/drawer.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar.component';
import { PriceComponent } from '../../../shared/ui/price/price.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-list',
  standalone: true,
  imports: [SkeletonComponent, IconComponent, DrawerComponent, EmptyStateComponent, SearchBarComponent, PriceComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly Math = Math;

  ngOnInit() {
    this.productStore.loadAll();
  }

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

  onSearchSubmit(query: string) {
    this.productStore.setSearchQuery(query);
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

  viewProductDetails(productId: string) {
    this.productStore.setSelectedProductId(productId);
  }

  retryLoading() {
    this.productStore.loadAll();
  }

  onToggleWishlist(event: Event, product: Product) {
    event.stopPropagation();
    event.preventDefault();
    this.userStore.toggleWishlist(product);
  }

  filterButtonClass(catId: string | null): string {
    const base = 'w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer';
    const active = this.productStore.selectedCategoryId() === catId
      ? 'bg-primary-50 text-primary-700 font-bold border-l-4 border-primary-600'
      : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-4 border-transparent';
    return `${base} ${active}`;
  }

  filterChipClass(catId: string | null): string {
    const base = 'font-medium px-4 py-2.5 rounded-full text-[13px] transition-all border whitespace-nowrap cursor-pointer';
    const active = this.productStore.selectedCategoryId() === catId
      ? 'bg-primary-600 border-primary-700 text-white'
      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50';
    return `${base} ${active}`;
  }
}
