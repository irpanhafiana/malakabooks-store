import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderStore } from './order.store';
import { OrderApiService } from '../core/services/order-api.service';
import { AlertService } from '../core/services/alert.service';
import { CartStore } from './cart.store';
import { Order } from '../core/models';

describe('OrderStore', () => {
  let store: OrderStore;
  const mockOrderApi = {
    getOrdersByUserId: vi.fn(),
    getOrderById: vi.fn(),
    getOrders: vi.fn(),
    saveOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    createShipment: vi.fn(),
    createBulkShipment: vi.fn(),
    cancelShipment: vi.fn(),
    detailResi: vi.fn()
  };
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };
  const mockCartStore = {
    clearCart: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        OrderStore,
        { provide: OrderApiService, useValue: mockOrderApi },
        { provide: AlertService, useValue: mockToast },
        { provide: CartStore, useValue: mockCartStore }
      ]
    });
    store = TestBed.inject(OrderStore);
  });

  it('should create', () => {
    expect(store).toBeTruthy();
    expect(store.orders()).toEqual([]);
    expect(store.currentOrder()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('should load user orders successfully', async () => {
    const mockOrders: Order[] = [
      { id: 'O1', userId: 'U1', total: 100000, status: 'pending' } as unknown as Order
    ];
    mockOrderApi.getOrdersByUserId.mockResolvedValue(mockOrders);

    await store.loadUserOrders('U1');

    expect(mockOrderApi.getOrdersByUserId).toHaveBeenCalledWith('U1');
    expect(store.orders()).toEqual(mockOrders);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle user orders loading error', async () => {
    mockOrderApi.getOrdersByUserId.mockRejectedValue(new Error('Load error'));

    await store.loadUserOrders('U1');

    expect(store.orders()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Gagal memuat data riwayat pesanan. Silakan coba lagi.');
  });

  it('should load order details successfully', async () => {
    const mockOrder = { id: 'O1', userId: 'U1', total: 100000, status: 'pending' } as unknown as Order;
    mockOrderApi.getOrderById.mockResolvedValue(mockOrder);

    await store.loadOrderDetails('O1');

    expect(mockOrderApi.getOrderById).toHaveBeenCalledWith('O1');
    expect(store.currentOrder()).toEqual(mockOrder);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle order details loading error', async () => {
    mockOrderApi.getOrderById.mockRejectedValue(new Error('Load error'));

    await store.loadOrderDetails('O1');

    expect(store.currentOrder()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Gagal memuat detail pesanan. Silakan coba lagi.');
  });

  it('should place order successfully and clear cart', async () => {
    const orderInput = {
      userId: 'U1',
      total: 100000,
      items: []
    } as unknown as Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'>;
    const savedOrder = {
      ...orderInput,
      id: 'O2',
      status: 'pending',
      orderDate: '2026-08-13T00:00:00Z',
      trackingNumber: ''
    } as unknown as Order;
    mockOrderApi.saveOrder.mockResolvedValue(savedOrder);

    const result = await store.placeOrder(orderInput);

    expect(mockOrderApi.saveOrder).toHaveBeenCalled();
    expect(mockCartStore.clearCart).toHaveBeenCalled();
    expect(store.orders()).toContainEqual(savedOrder);
    expect(store.currentOrder()).toEqual(savedOrder);
    expect(mockToast.success).toHaveBeenCalledWith('Pesanan berhasil dibuat!');
    expect(result).toEqual(savedOrder);
  });

  it('should handle place order error', async () => {
    mockOrderApi.saveOrder.mockRejectedValue(new Error('Save error'));

    const result = await store.placeOrder({ userId: 'U1', total: 100000, items: [] } as unknown as Omit<Order, 'id' | 'orderDate' | 'status' | 'trackingNumber'>);

    expect(result).toBeNull();
    expect(mockToast.error).toHaveBeenCalledWith('Gagal membuat pesanan.');
  });

  it('should update order status successfully', async () => {
    const initialOrder = { id: 'O1', userId: 'U1', total: 100000, status: 'pending' } as unknown as Order;
    store['state'].update(s => ({ ...s, orders: [initialOrder] }));
    mockOrderApi.updateOrderStatus.mockResolvedValue(true);

    await store.updateOrderStatus('O1', 'completed');

    expect(mockOrderApi.updateOrderStatus).toHaveBeenCalledWith('O1', 'completed');
    expect(store.orders()[0].status).toBe('completed');
    expect(mockToast.success).toHaveBeenCalledWith('Status pesanan #O1 diperbarui menjadi completed.');
  });

  it('should handle update status fail and reload orders', async () => {
    const initialOrder = { id: 'O1', userId: 'U1', total: 100000, status: 'pending' } as Order;
    store['state'].update(s => ({ ...s, orders: [initialOrder] }));
    mockOrderApi.updateOrderStatus.mockResolvedValue(false);
    mockOrderApi.getOrders.mockResolvedValue([initialOrder]);

    await store.updateOrderStatus('O1', 'completed');

    expect(mockToast.error).toHaveBeenCalledWith('Gagal memperbarui status pesanan. Silakan coba lagi.');
    expect(mockOrderApi.getOrders).toHaveBeenCalled();
  });
});
