import { Component, inject, signal, effect, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProductDetailComponent, BottomSheetComponent],
  templateUrl: './search-layout.component.html',
  styleUrl: './search-layout.component.css'
})
export class SearchLayoutComponent {
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
  protected readonly productStore = inject(ProductStore);
  protected readonly toastService = inject(ToastService);

  isDetailOpen = signal<boolean>(false);
  selectedDetailId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.productStore.selectedProductId();
      if (id) {
        this.selectedDetailId.set(id);
        this.isDetailOpen.set(true);
      } else {
        this.isDetailOpen.set(false);
        // Wait for animation before clearing ID to avoid UI jumps
        setTimeout(() => {
          this.selectedDetailId.set(null);
        }, 300);
      }
    });
  }

  closeProductDetails() {
    this.productStore.setSelectedProductId(null);
  }

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
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
