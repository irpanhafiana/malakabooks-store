import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { PricingApiService } from '../../core/services/pricing-api.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { QtyModalContentComponent } from '../../shared/ui/qty-modal-content/qty-modal-content.component';
import { ToastContainerComponent } from '../../shared/ui/toast-container/toast-container.component';
import { ScreenService } from '../../core/services/screen.service';
import { DesktopHeaderComponent } from '../desktop/desktop-header/desktop-header.component';
import { DesktopFooterComponent } from '../desktop/desktop-footer/desktop-footer.component';
import { ProductModalHandler } from '../product-modal-handler.service';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProductDetailComponent, BottomSheetComponent, ModalComponent, QtyModalContentComponent, ToastContainerComponent, DesktopHeaderComponent, DesktopFooterComponent, PriceComponent, ButtonComponent],
  templateUrl: './search-layout.component.html',
  styleUrl: './search-layout.component.css'
})
export class SearchLayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
  protected readonly pricingApi = inject(PricingApiService);
  protected readonly toastService = inject(ToastService);
  protected readonly screen = inject(ScreenService);
  protected readonly modalHandler = inject(ProductModalHandler);

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
  }
}
