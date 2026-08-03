import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { CartStore } from '../../../store/cart.store';
import { ProductStore } from '../../../store/product.store';
import { SearchBarComponent } from '../../../shared/ui/search-bar/search-bar.component';
import { SpinnerComponent } from '../../../shared/ui/spinner/spinner.component';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-desktop-header',
  standalone: true,
  imports: [RouterLink, SearchBarComponent, SpinnerComponent],
  templateUrl: './desktop-header.component.html',
  styleUrl: './desktop-header.component.css',
  host: {
    'class': 'block h-20 w-full z-50'
  }
})
export class DesktopHeaderComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly cartStore = inject(CartStore);
  protected readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  protected autofillResults = signal<Product[] | null>(null);
  protected isLoadingAutofill = signal<boolean>(false);
  protected isDropdownOpen = signal<boolean>(false);
  protected readonly Math = Math;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  async onSearchInput(query: string) {
    const trimmed = query.trim();
    if (trimmed.length >= 3) {
      this.isLoadingAutofill.set(true);
      try {
        if (this.productStore.products().length === 0) {
          await this.productStore.loadAll();
        }
        const q = trimmed.toLowerCase();
        const matches = this.productStore.products()
          .filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.authorNames || '').toLowerCase().includes(q) ||
            (p.categoryName || '').toLowerCase().includes(q)
          );

        this.autofillResults.set(matches);
        this.isDropdownOpen.set(true);
      } finally {
        this.isLoadingAutofill.set(false);
      }
    } else {
      this.autofillResults.set(null);
      this.isDropdownOpen.set(false);
    }
  }

  selectProduct(productId: string) {
    this.isDropdownOpen.set(false);
    this.autofillResults.set(null);
    this.productStore.setSelectedProductId(productId);
  }

  onSearch(query: string) {
    this.isDropdownOpen.set(false);
    this.productStore.setSearchQuery(query);
    if (this.router.url !== '/product') {
      this.router.navigate(['/product']);
    }
  }

  resetFilters() {
    this.productStore.setCategoryFilter(null);
    this.productStore.setSearchQuery('');
    this.isDropdownOpen.set(false);
  }
}
