import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { DatePipe } from '@angular/common';
import { ComplaintStore } from '../../../../store/complaint.store';
import { Complaint, ComplaintStatus } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { ComplaintsFormComponent } from '../form/complaints-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-complaints-list',
  standalone: true,
  imports: [
    DatePipe,
    TableComponent,
    AdminButtonComponent,
    ModalComponent,
    PaginationComponent,
    ComplaintsFormComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    IconComponent
  ],
  templateUrl: './complaints-list.component.html',
  styleUrl: './complaints-list.component.css'
})
export class ComplaintsListComponent implements OnInit {
  protected readonly complaintStore = inject(ComplaintStore);

  protected readonly searchQuery = signal('');
  protected readonly filteredComplaints = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const all = this.complaintStore.complaints();
    if (!q) return all;
    return all.filter(c => 
      c.userId.toLowerCase().includes(q) ||
      c.orderId.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
  });

  protected readonly pagination = createClientPagination(this.filteredComplaints, 10);
  protected isModalOpen = false;
  protected readonly selected = signal<Complaint | null>(null);

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  ngOnInit() {
    this.complaintStore.loadAll();
  }

  protected openRespond(complaint: Complaint) {
    this.selected.set(complaint);
    this.isModalOpen = true;
  }

  protected closeModal() {
    this.isModalOpen = false;
  }
}
