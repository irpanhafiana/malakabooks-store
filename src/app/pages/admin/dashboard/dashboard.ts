import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { OrderService } from '../../../core/services/order.service';
import { ComplaintService } from '../../../core/services/complaint.service';
import { UserService } from '../../../core/services/user.service';
import { Order } from '../../../core/models/order.model';
import { Complaint } from '../../../core/models/complaint.model';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyRupiahPipe, LoadingSpinnerComponent],
  templateUrl: './dashboard.html'
})
export class DashboardPage implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly orderService = inject(OrderService);
  private readonly complaintService = inject(ComplaintService);
  private readonly userService = inject(UserService);

  // States
  isLoading = signal(true);
  
  // Data Signals
  books = signal<any[]>([]);
  orders = signal<Order[]>([]);
  complaints = signal<Complaint[]>([]);
  usersCount = signal(0);

  // Computed metrics
  readonly totalBooksCount = computed(() => this.books().length);
  readonly totalOrdersCount = computed(() => this.orders().length);
  readonly totalUsersCount = computed(() => this.usersCount());

  readonly completedOrdersCount = computed(() => {
    return this.orders().filter((o) => o.status === 'delivered').length;
  });

  readonly totalRevenue = computed(() => {
    return this.orders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((total, o) => total + o.totalPrice, 0);
  });

  readonly recentOrders = computed(() => {
    return this.orders().slice(0, 5);
  });

  readonly activeComplaints = computed(() => {
    return this.complaints()
      .filter((c) => c.status === 'open' || c.status === 'in_progress')
      .slice(0, 3);
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    // Book count
    this.bookService.getAll().subscribe((books) => this.books.set(books));

    // Users count
    this.userService.getAll().subscribe((users) => this.usersCount.set(users.length));

    // Complaints
    this.complaintService.getAll().subscribe((comps) => this.complaints.set(comps));

    // Orders
    this.orderService.getAll().subscribe((ords) => {
      // Sort by latest order first
      const sorted = [...ords].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.orders.set(sorted);
      this.isLoading.set(false);
    });
  }

  getStatusText(status: Order['status']): string {
    const mappings: Record<Order['status'], string> = {
      pending: 'Menunggu',
      processing: 'Diproses',
      shipped: 'Dikirim',
      delivered: 'Selesai',
      cancelled: 'Batal'
    };
    return mappings[status] || status;
  }
}
