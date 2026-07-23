import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersListComponent } from './orders-list.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderStore } from '../../../../store/order.store';
import { AlertService } from '../../../../core/services/alert.service';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { Order } from '../../../../core/models';

describe('OrdersListComponent', () => {
  let component: OrdersListComponent;
  let fixture: ComponentFixture<OrdersListComponent>;

  const mockOrderStore = {
    orders: signal<Order[]>([]),
    loading: signal(false),
    loadAllOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
    createShipment: vi.fn(),
    createBulkShipments: vi.fn()
  };

  const mockAlertService = {
    confirm: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  };

  beforeEach(async () => {
    TestBed.overrideComponent(OrdersListComponent, {
      set: { template: '<div></div>' }
    });

    await TestBed.configureTestingModule({
      imports: [OrdersListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: OrderStore, useValue: mockOrderStore },
        { provide: AlertService, useValue: mockAlertService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all orders on init', () => {
    expect(mockOrderStore.loadAllOrders).toHaveBeenCalled();
  });

  it('should toggle selection of an order', () => {
    component.toggleSelectOrder('ORDER1');
    expect((component as any).selectedOrderIds()).toContain('ORDER1');
    
    component.toggleSelectOrder('ORDER1');
    expect((component as any).selectedOrderIds()).not.toContain('ORDER1');
  });
});
