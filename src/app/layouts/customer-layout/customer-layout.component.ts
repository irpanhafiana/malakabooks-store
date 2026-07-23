import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
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

import { PricingApiService } from '../../core/services/pricing-api.service';

import { ToastContainerComponent } from '../../shared/ui/toast-container/toast-container.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-customer-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchBarComponent, ProductDetailComponent, BottomSheetComponent, QuantitySelectorComponent, ButtonComponent, PriceComponent, ToastContainerComponent],
    templateUrl: './customer-layout.component.html',
    styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {
    protected readonly authStore = inject(AuthStore);
    protected readonly cartStore = inject(CartStore);
    protected readonly userStore = inject(UserStore);
    protected readonly productStore = inject(ProductStore);
    protected readonly pricingApi = inject(PricingApiService);
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

        // Effect for Qty Modal opening
        effect(() => {
            const isOpen = this.productStore.isQtyModalOpen();
            const prod = this.productStore.activeProduct();
            if (isOpen && prod) {
                const initialUom = prod.baseUomCode || (prod.uomGroup?.details?.[0]?.code) || null;
                this.productStore.setQtyUomCode(initialUom);
                this.productStore.setQtyLookedUpPrice(prod.price); // Set initial fallback
                
                if (initialUom) {
                    this.lookupPrice(prod.id, initialUom);
                }
            }
        });
    }

    async lookupPrice(itemId: string, uomCode: string) {
        this.productStore.setIsQtyLookupLoading(true);
        try {
            if (this.authStore.isLoggedIn()) {
                const res = await this.pricingApi.lookupCustomerPrice(itemId, uomCode);
                if (res) this.productStore.setQtyLookedUpPrice(res.price);
            } else {
                const prod = this.productStore.activeProduct();
                const res = await this.pricingApi.lookupPublicPrice(itemId, uomCode, prod?.customerGroupCode);
                if (res) this.productStore.setQtyLookedUpPrice(res.price);
            }
        } finally {
            this.productStore.setIsQtyLookupLoading(false);
        }
    }

    selectUom(code: string) {
        this.productStore.setQtyUomCode(code);
        const prod = this.productStore.activeProduct();
        if (prod) {
            this.lookupPrice(prod.id, code);
        }
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

    closeQty(fromConfirm: boolean = false) {
        this.productStore.setQtyModalOpen(false);

        // If buying, we navigate away so don't reopen detail
        if (!fromConfirm || this.productStore.qtyAction() === 'cart') {
            if (this.productStore.reopenDetailOnQtyClose()) {
                const activeProd = this.productStore.activeProduct();
                if (activeProd) {
                    this.productStore.setSelectedProductId(activeProd.id);
                }
            }
        }
        this.productStore.setReopenDetailOnQtyClose(false);
    }

    onQtyChange(newQty: number) {
        this.productStore.setQtyQuantity(newQty);
    }

    confirmAddToCart() {
        const prod = this.productStore.activeProduct();
        const qty = this.productStore.qtyQuantity();
        const action = this.productStore.qtyAction();
        const uom = this.productStore.qtyUomCode();
        const price = this.productStore.qtyLookedUpPrice();

        if (prod) {
            this.cartStore.addItem(prod, qty, uom || undefined, price || undefined);
            if (action === 'buy') {
                this.router.navigate(['/checkout']);
            }
        }
        this.closeQty(true);
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
