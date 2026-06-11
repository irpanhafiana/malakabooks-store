import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchBarComponent, ProductDetailComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isDetailOpen = signal<boolean>(false);
  isDetailAnimating = signal<boolean>(false);
  selectedDetailId = signal<string | null>(null);
  isSearchActive = signal<boolean>(false);

  constructor() {
    effect(() => {
      const id = this.productStore.selectedProductId();
      if (id) {
        this.selectedDetailId.set(id);
        this.isDetailOpen.set(true);
        setTimeout(() => {
          this.isDetailAnimating.set(true);
        }, 16);
      } else {
        this.isDetailAnimating.set(false);
        setTimeout(() => {
          this.isDetailOpen.set(false);
          this.selectedDetailId.set(null);
        }, 300);
      }
    });
  }

  closeProductDetails() {
    this.productStore.setSelectedProductId(null);
  }

  onSearch(query: string) {
    this.productStore.setSearchQuery(query);
    this.isSearchActive.set(false);
    this.router.navigate(['/product']);
  }

  filterByCategory(catId: string) {
    this.productStore.setCategoryFilter(catId);
  }

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
  }

  toastClass(type: string): string {
    const borderType = {
      success: 'border-l-4 border-l-emerald-500 shadow-emerald-500/5 shadow-md',
      error: 'border-l-4 border-l-rose-500 shadow-rose-500/5 shadow-md',
      info: 'border-l-4 border-l-blue-500 shadow-blue-500/5 shadow-md',
      warning: 'border-l-4 border-l-amber-500 shadow-amber-500/5 shadow-md'
    };
    return borderType[type as keyof typeof borderType] || 'border-l-4 border-l-blue-500';
  }
}
