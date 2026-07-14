import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerLayoutComponent } from './customer-layout.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { UserStore } from '../../store/user.store';
import { ProductStore } from '../../store/product.store';
import { ToastService } from '../../core/services/toast.service';
import { signal } from '@angular/core';

describe('CustomerLayoutComponent', () => {
  let component: CustomerLayoutComponent;
  let fixture: ComponentFixture<CustomerLayoutComponent>;
  let router: Router;

  const mockAuthStore = { isLoggedIn: signal(false), currentUser: signal(null) };
  const mockCartStore = { addItem: vi.fn(), itemsCount: signal(0) };
  const mockUserStore = {};
  
  const mockProductStore = {
    selectedProductId: signal<string | null>(null),
    setSelectedProductId: vi.fn(),
    setSearchQuery: vi.fn(),
    setCategoryFilter: vi.fn(),
    isQtyModalOpen: signal(false),
    qtyModalOpen: signal(false),
    setQtyModalOpen: vi.fn(),
    qtyQuantity: signal(1),
    setQtyQuantity: vi.fn(),
    activeProduct: signal(null),
    qtyAction: signal('cart'),
    reopenDetailOnQtyClose: vi.fn(),
    setReopenDetailOnQtyClose: vi.fn()
  };

  const mockToast = { success: vi.fn(), toasts: signal([]) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: CartStore, useValue: mockCartStore },
        { provide: UserStore, useValue: mockUserStore },
        { provide: ProductStore, useValue: mockProductStore },
        { provide: ToastService, useValue: mockToast }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate and set search query on onSearch', () => {
    component.onSearch('angular');
    expect(mockProductStore.setSearchQuery).toHaveBeenCalledWith('angular');
    expect(component.isSearchActive()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/product']);
  });

  it('should reset filters', () => {
    component.resetFilters();
    expect(mockProductStore.setCategoryFilter).toHaveBeenCalledWith(null);
    expect(mockProductStore.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('should add to cart and close modal on confirmAddToCart if product is active', () => {
    const mockProduct = { id: 'P1', name: 'Book' };
    mockProductStore.activeProduct.set(mockProduct as any);
    mockProductStore.qtyQuantity.set(2);

    component.confirmAddToCart();

    expect(mockCartStore.addItem).toHaveBeenCalledWith(mockProduct, 2);
    expect(mockToast.success).toHaveBeenCalledWith('Added to cart!');
    expect(mockProductStore.setQtyModalOpen).toHaveBeenCalledWith(false);
  });
});
