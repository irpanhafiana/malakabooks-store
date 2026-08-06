import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartStore } from './cart.store';
import { CartApiService } from '../core/services/cart-api.service';
import { AlertService } from '../core/services/alert.service';
import { Product } from '../core/models';

describe('CartStore', () => {
  let store: CartStore;
  const mockCartApi = {
    addCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    getCart: vi.fn()
  };
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        CartStore,
        { provide: CartApiService, useValue: mockCartApi },
        { provide: AlertService, useValue: mockToast }
      ]
    });
    store = TestBed.inject(CartStore);
  });

  it('should create', () => {
    expect(store).toBeTruthy();
    expect(store.items()).toEqual([]);
  });

  it('should add item and calculate totals correctly', async () => {
    const product = {
      id: '1', title: 'Test Book', price: 100000, stock: 10,
      authors: [{ id: '1', name: 'A', role: 'author', biography: '', photoUrl: '' }], categoryId: 'C', coverImage: 'img', description: 'desc', pages: 100,
      isbn: '123', publisher: 'P', publishedYear: 2023, weight: 1
    } as unknown as Product;
    await store.addItem(product, 2);
    expect(store.items().length).toBe(1);
    expect(store.items()[0].quantity).toBe(2);
    expect(store.subtotal()).toBe(200000);
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('should reject adding item if out of stock', async () => {
    const product = {
      id: '1', title: 'Test Book', price: 100000, stock: 0,
      authors: [{ id: '1', name: 'A', role: 'author', biography: '', photoUrl: '' }], categoryId: 'C', coverImage: 'img', description: 'desc', pages: 100,
      isbn: '123', publisher: 'P', publishedYear: 2023, weight: 1
    } as unknown as Product;
    await store.addItem(product, 1);
    expect(store.items().length).toBe(0);
    expect(mockToast.error).toHaveBeenCalledWith('Maaf, produk ini kehabisan stok!');
  });
});
