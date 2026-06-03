import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../../core/services/complaint.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Complaint } from '../../../core/models/complaint.model';
import { Order } from '../../../core/models/order.model';

import { ViewportService } from '../../../core/services/viewport.service';
import { ComplaintsDesktopComponent } from './complaints-desktop';
import { ComplaintsMobileComponent } from './complaints-mobile';

@Component({
  selector: 'app-complaints-page',
  standalone: true,
  imports: [
    CommonModule,
    ComplaintsDesktopComponent,
    ComplaintsMobileComponent
  ],
  templateUrl: './complaints.html'
})
export class ComplaintsPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly complaintService = inject(ComplaintService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  complaints = signal<Complaint[]>([]);
  userOrders = signal<Order[]>([]);

  get orderOptions() {
    return this.userOrders().map((ord) => ({
      label: `${ord.id} - ${ord.items[0]?.title || 'Buku'} (Rp ${ord.totalPrice.toLocaleString('id-ID')})`,
      value: ord.id
    }));
  }
  
  // States
  isLoading = signal(true);
  showForm = signal(false);
  isSubmitting = signal(false);

  // Form Fields
  selectedOrderId = '';
  subject = '';
  description = '';

  ngOnInit() {
    this.loadComplaints();
    this.loadUserOrders();
  }

  loadComplaints() {
    const user = this.authService.currentUser();
    if (user) {
      this.complaintService.getByUser(user.id).subscribe((list) => {
        this.complaints.set(list);
        this.isLoading.set(false);
      });
    }
  }

  loadUserOrders() {
    const user = this.authService.currentUser();
    if (user) {
      this.orderService.getByUser(user.id).subscribe((list) => {
        // Exclude cancelled and pending if we only want to complain on processed orders (though showing all is fine too)
        this.userOrders.set(list.filter((o) => o.status !== 'cancelled' && o.status !== 'pending'));
      });
    }
  }

  openAddForm() {
    this.resetForm();
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  resetForm() {
    this.selectedOrderId = '';
    this.subject = '';
    this.description = '';
  }

  onSubmitComplaint() {
    if (!this.selectedOrderId || !this.subject || !this.description) {
      this.toastService.showError('Silakan lengkapi semua kolom komplain.');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);

    this.complaintService
      .createComplaint(user.id, this.selectedOrderId, this.subject, this.description)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess('Tiket komplain berhasil dikirimkan.');
          this.closeForm();
          this.loadComplaints();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastService.showError('Gagal mengirimkan tiket komplain.');
        }
      });
  }

  getStatusText(status: Complaint['status']): string {
    const mappings: Record<Complaint['status'], string> = {
      open: 'Baru',
      in_progress: 'Diproses',
      resolved: 'Terselesaikan',
      closed: 'Ditutup'
    };
    return mappings[status] || status;
  }
}
