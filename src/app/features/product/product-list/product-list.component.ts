import { Component, inject, signal, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { ProductStore } from '../../../store/product.store';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { Product } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { BottomSheetComponent } from '../../../shared/ui/bottom-sheet/bottom-sheet.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar.component';
import { ProductCardComponent } from '../../../shared/ui/product-card/product-card.component';
import { MasonryGridComponent } from '../../../shared/ui/masonry-grid/masonry-grid.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-list',
  standalone: true,
  imports: [SkeletonComponent, IconComponent, BottomSheetComponent, EmptyStateComponent, SearchBarComponent, ProductCardComponent, MasonryGridComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  private readonly location = inject(Location);

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

  goBack() {
    this.location.back();
  }

  onAddToCart(product: Product) {
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setQtyModalOpen(true);
  }
}
