import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartStore } from '../../store/cart.store';
import { ProductStore } from '../../store/product.store';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  const mockCartStore = {
    applyPromo: vi.fn(),
    itemsCount: signal(0)
  };

  const mockProductStore = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        { provide: CartStore, useValue: mockCartStore },
        { provide: ProductStore, useValue: mockProductStore },
        { provide: ActivatedRoute, useValue: { snapshot: {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call applyPromo if code is empty', () => {
    component.promoControl.setValue('');
    component.applyPromo();
    expect(mockCartStore.applyPromo).not.toHaveBeenCalled();
  });

  it('should call applyPromo and reset input if successful', () => {
    component.promoControl.setValue('PROMO123');
    mockCartStore.applyPromo.mockReturnValue(true);

    component.applyPromo();

    expect(mockCartStore.applyPromo).toHaveBeenCalledWith('PROMO123');
    expect(component.promoControl.value).toBeNull(); // reset() turns it to null by default
  });
});
