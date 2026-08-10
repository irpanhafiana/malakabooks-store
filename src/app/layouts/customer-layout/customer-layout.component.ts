import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductStore } from '../../store/product.store';
import { AlertService } from '../../core/services/alert.service';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar.component';
import { ProductDetailComponent } from '../../features/product/product-detail/product-detail.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { PricingApiService } from '../../core/services/pricing-api.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { QtyModalContentComponent } from '../../shared/ui/qty-modal-content/qty-modal-content.component';

import { ScreenService } from '../../core/services/screen.service';
import { DesktopHeaderComponent } from '../desktop/desktop-header/desktop-header.component';
import { DesktopFooterComponent } from '../desktop/desktop-footer/desktop-footer.component';
import { ProductModalHandler } from '../product-modal-handler.service';
import { PriceComponent } from '../../shared/ui/price/price.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-customer-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchBarComponent, ProductDetailComponent, BottomSheetComponent, ModalComponent, QtyModalContentComponent,  DesktopHeaderComponent, DesktopFooterComponent, PriceComponent, ButtonComponent],
    templateUrl: './customer-layout.component.html',
    styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {
    protected readonly authStore = inject(AuthStore);
    protected readonly cartStore = inject(CartStore);
    protected readonly userStore = inject(UserStore);
    protected readonly productStore = inject(ProductStore);
    protected readonly pricingApi = inject(PricingApiService);
    protected readonly alertService = inject(AlertService);
    protected readonly screen = inject(ScreenService);
    protected readonly modalHandler = inject(ProductModalHandler);
    private readonly router = inject(Router);

    isSearchActive = signal<boolean>(false);

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
}

