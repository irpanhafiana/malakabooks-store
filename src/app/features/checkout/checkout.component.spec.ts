import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutComponent } from './checkout.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { CartStore } from '../../store/cart.store';
import { OrderStore } from '../../store/order.store';
import { AlertService } from '../../core/services/alert.service';
import { AddressApiService } from '../../core/services/address-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { ShippingService } from '../../core/services/shipping.service';
import { ExternalMessageService } from '../../core/services/external-message.service';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { signal } from '@angular/core';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  const mockRouter = { navigate: vi.fn(), url: '/checkout' };
  const mockAuthStore = { 
    isLoggedIn: vi.fn().mockReturnValue(true),
    currentUser: vi.fn().mockReturnValue({ id: '1', addresses: [] })
  };
  const mockCartStore = {
    subtotal: vi.fn().mockReturnValue(100000),
    discount: vi.fn().mockReturnValue(0),
    itemsCount: signal(0),
    items: vi.fn().mockReturnValue([])
  };
  const mockOrderStore = { placeOrder: vi.fn() };
  const mockToast = { info: vi.fn(), error: vi.fn(), success: vi.fn() };
  const mockAddressApi = {};
  const mockUserApi = { getAddressesByUserId: vi.fn().mockResolvedValue([]) };
  
  const mockShippingService = {
    provinces: signal([]),
    cities: signal([]),
    districts: signal([]),
    shippingCost: signal(0),
    shippingLoading: signal(false),
    courierServices: signal([]),
    loadProvinces: vi.fn().mockResolvedValue([]),
    loadCities: vi.fn(),
    loadDistricts: vi.fn(),
    clearCities: vi.fn(),
    clearDistricts: vi.fn()
  };

  const mockPaymentApi = { getPayments: vi.fn().mockResolvedValue([]) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: CartStore, useValue: mockCartStore },
        { provide: OrderStore, useValue: mockOrderStore },
        { provide: AlertService, useValue: mockToast },
        { provide: AddressApiService, useValue: mockAddressApi },
        { provide: UserApiService, useValue: mockUserApi },
        { provide: ShippingService, useValue: mockShippingService },
        { provide: PaymentApiService, useValue: mockPaymentApi },
        { provide: ExternalMessageService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    component.loadCouriers = vi.fn().mockResolvedValue(undefined);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate checkout total correctly (subtotal + tax + shipping - discount)', () => {
    expect(component.checkoutTotal()).toBe(100000);
  });

  it('should be invalid if address form is shown but incomplete', () => {
    component.showAddressForm.set(true);
    expect(component.isOrderInvalid()).toBe(true);
    expect(mockToast.error).toHaveBeenCalledWith('Please complete your shipping address');
  });

  it('should be invalid if courier is not selected', () => {
    component.showAddressForm.set(false);
    component.selectedAddressId.set('addr-1'); // address valid
    component.courierControl.setValue('');
    expect(component.isOrderInvalid()).toBe(true);
    expect(mockToast.error).toHaveBeenCalledWith('Please select a shipping courier');
  });
});
