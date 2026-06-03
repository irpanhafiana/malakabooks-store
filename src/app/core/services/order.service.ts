import { Injectable, signal, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Order, OrderItem } from '../models/order.model';
import { ORDERS_DATA } from '../data/orders.data';
import { BookService } from './book.service';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly ORDERS_KEY = 'malaka_orders';
  private readonly bookService = inject(BookService);
  private readonly cartService = inject(CartService);

  private orders = signal<Order[]>([]);

  constructor() {
    this.initOrders();
  }

  private initOrders() {
    const stored = localStorage.getItem(this.ORDERS_KEY);
    if (stored) {
      this.orders.set(JSON.parse(stored));
    } else {
      this.orders.set(ORDERS_DATA);
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(ORDERS_DATA));
    }
  }

  getAll(): Observable<Order[]> {
    return of(this.orders()).pipe(delay(300));
  }

  getByUser(userId: string): Observable<Order[]> {
    const userOrders = this.orders().filter((o) => o.userId === userId);
    // Sort by latest order first
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(userOrders).pipe(delay(250));
  }

  getById(id: string): Observable<Order | undefined> {
    const order = this.orders().find((o) => o.id === id);
    return of(order).pipe(delay(200));
  }

  createOrder(
    userId: string,
    items: OrderItem[],
    addressId: string,
    totalPrice: number,
    note: string
  ): Observable<Order> {
    const newOrder: Order = {
      id: `ord-${1000 + this.orders().length + 1 + Math.floor(Math.random() * 100)}`,
      userId,
      items,
      addressId,
      status: 'pending',
      totalPrice,
      note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deduct books stock
    items.forEach((item) => {
      const book = this.bookService.booksSignal().find((b) => b.id === item.bookId);
      if (book) {
        const newStock = Math.max(0, book.stock - item.quantity);
        this.bookService.update(item.bookId, { stock: newStock }).subscribe();
      }
    });

    // Save order
    const updated = [newOrder, ...this.orders()];
    this.orders.set(updated);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(updated));

    // Clear cart
    this.cartService.clear();

    return of(newOrder).pipe(delay(400));
  }

  updateStatus(id: string, status: Order['status']): Observable<Order> {
    const orderIndex = this.orders().findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return throwError(() => new Error('Pesanan tidak ditemukan.')).pipe(delay(200));
    }

    const currentOrder = this.orders()[orderIndex];
    
    // If order is cancelled, restore books stock
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      currentOrder.items.forEach((item) => {
        const book = this.bookService.booksSignal().find((b) => b.id === item.bookId);
        if (book) {
          this.bookService.update(item.bookId, { stock: book.stock + item.quantity }).subscribe();
        }
      });
    }

    const updatedOrder: Order = {
      ...currentOrder,
      status,
      updatedAt: new Date().toISOString()
    };

    const updatedList = this.orders().map((o) => (o.id === id ? updatedOrder : o));
    this.orders.set(updatedList);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(updatedList));

    return of(updatedOrder).pipe(delay(300));
  }
}
