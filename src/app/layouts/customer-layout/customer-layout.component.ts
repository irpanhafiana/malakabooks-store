import { Component, inject, signal, effect, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { QuantitySelectorComponent } from '../../shared/ui/quantity-selector/quantity-selector.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { PriceComponent } from '../../shared/ui/price/price.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchBarComponent, ProductDetailComponent, BottomSheetComponent, QuantitySelectorComponent, ButtonComponent, PriceComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {
  @ViewChild('routeContainer') routeContainer!: ElementRef;

  onRouteActivate() {
    if (this.routeContainer) {
      const el = this.routeContainer.nativeElement;
      el.classList.remove('animate-page-fade');
      // Trigger reflow to restart CSS animation
      void el.offsetWidth;
      el.classList.add('animate-page-fade');
    }
  }
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly userStore = inject(UserStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isDetailOpen = signal<boolean>(false);
  selectedDetailId = signal<string | null>(null);
  isSearchActive = signal<boolean>(false);

  constructor() {
    effect(() => {
      const id = this.productStore.selectedProductId();

      if (id) {
        this.selectedDetailId.set(id);
        this.isDetailOpen.set(true);
      } else {
        this.isDetailOpen.set(false);
        setTimeout(() => {
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

  closeQty() {
    this.productStore.setQtyModalOpen(false);
  }

  onQtyChange(newQty: number) {
    this.productStore.setQtyQuantity(newQty);
  }

  confirmAddToCart() {
    const prod = this.productStore.activeProduct();
    const qty = this.productStore.qtyQuantity();
    if (prod) {
      this.cartStore.addItem(prod, qty);
      this.toastService.success('Added to cart!');
    }
    this.productStore.setQtyModalOpen(false);
  }

  toastClass(type: string): string {
    const borderType = {
      success: 'border-l-4 border-l-emerald-500',
      error: 'border-l-4 border-l-rose-500',
      info: 'border-l-4 border-l-blue-500',
      warning: 'border-l-4 border-l-amber-500'
    };
    return borderType[type as keyof typeof borderType] || 'border-l-4 border-l-blue-500';
  }
}
