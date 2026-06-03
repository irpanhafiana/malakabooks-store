import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../../core/services/complaint.service';
import { Complaint } from '../../../core/models/complaint.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-complaints-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, FormInputComponent],
  templateUrl: './complaints-management.html'
})
export class ComplaintsManagementPage implements OnInit {
  private readonly complaintService = inject(ComplaintService);
  private readonly toastService = inject(ToastService);

  complaints = signal<Complaint[]>([]);
  filteredComplaints = signal<Complaint[]>([]);

  statusOptions = [
    { label: 'Aduan Baru (Open)', value: 'open' },
    { label: 'Diproses (In Progress)', value: 'in_progress' },
    { label: 'Terselesaikan (Resolved)', value: 'resolved' },
    { label: 'Ditutup (Closed)', value: 'closed' }
  ];

  // States
  isLoading = signal(true);
  showModal = signal(false);
  activeComplaint = signal<Complaint | null>(null);

  statusFilter = 'all';

  // Form Fields
  adminResponse = '';
  newStatus: Complaint['status'] = 'resolved';

  ngOnInit() {
    this.loadComplaints();
  }

  loadComplaints() {
    this.isLoading.set(true);
    this.complaintService.getAll().subscribe((list) => {
      // Sort by latest complaint first
      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.complaints.set(sorted);
      this.applyFilter();
      this.isLoading.set(false);
    });
  }

  applyFilter() {
    if (this.statusFilter === 'all') {
      this.filteredComplaints.set(this.complaints());
    } else {
      const filtered = this.complaints().filter((c) => c.status === this.statusFilter);
      this.filteredComplaints.set(filtered);
    }
  }

  openRespondModal(comp: Complaint) {
    this.activeComplaint.set(comp);
    this.adminResponse = comp.adminResponse;
    this.newStatus = comp.status;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.activeComplaint.set(null);
    this.adminResponse = '';
  }

  onSubmitResponse() {
    const comp = this.activeComplaint();
    if (!comp) return;

    if (!this.adminResponse.trim()) {
      this.toastService.showError('Silakan masukkan respon balasan resmi admin.');
      return;
    }

    this.isLoading.set(true);
    this.complaintService
      .respond(comp.id, this.adminResponse.trim(), this.newStatus)
      .subscribe({
        next: () => {
          this.toastService.showSuccess(`Berhasil mengirimkan respon untuk tiket komplain.`);
          this.closeModal();
          this.loadComplaints();
        },
        error: () => {
          this.isLoading.set(false);
          this.toastService.showError('Gagal mengirimkan respon komplain.');
        }
      });
  }

  getStatusText(status: Complaint['status']): string {
    const mappings: Record<Complaint['status'], string> = {
      open: 'Baru',
      in_progress: 'Diproses',
      resolved: 'Selesai',
      closed: 'Ditutup'
    };
    return mappings[status] || status;
  }
}
