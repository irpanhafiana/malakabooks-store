import { Component, inject, signal, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { ProductStore } from '../../../store/product.store';
import { CartStore } from '../../../store/cart.store';
import { UserStore } from '../../../store/user.store';
import { AuthStore } from '../../../store/auth.store';
import { Product } from '../../../core/models';
import { ScreenService } from '../../../core/services/screen.service';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
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
  imports: [SkeletonComponent, IconComponent, BottomSheetComponent, ModalComponent, EmptyStateComponent, SearchBarComponent, ProductCardComponent, MasonryGridComponent, NgTemplateOutlet],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  protected readonly screen = inject(ScreenService);
  protected readonly productStore = inject(ProductStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly authStore = inject(AuthStore);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  ngOnInit() {
    if (this.screen.isDesktop()) {
      this.router.navigate(['/']);
      return;
    }
    this.productStore.loadAll();
  }

  isFiltersOpen = signal<boolean>(false);
  activeCategoryName = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.screen.isDesktop()) {
        this.router.navigate(['/']);
      }
    });

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

  onSortChange(sortBy: 'rating' | 'featured' | 'price-asc' | 'price-desc' | string) {
    this.productStore.setSortBy(sortBy as any);
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
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.productStore.setActiveProduct(product);
    this.productStore.setQtyQuantity(1);
    this.productStore.setQtyAction('cart');
    this.productStore.setQtyModalOpen(true);
  }
}
