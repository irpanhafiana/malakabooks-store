import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ComplaintStore } from '../../../../store/complaint.store';
import { Complaint, ComplaintStatus } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { createClientPagination } from '../../../../shared/util/pagination.util';
import { ComplaintsFormComponent } from '../form/complaints-form.component';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-complaints-list',
  standalone: true,
  imports: [
    DatePipe,
    TableComponent,
    BadgeComponent,
    ButtonComponent,
    ModalComponent,
    PaginationComponent,
    ComplaintsFormComponent,
    SpinnerComponent
  ],
  templateUrl: './complaints-list.component.html',
  styleUrl: './complaints-list.component.css'
})
export class ComplaintsListComponent implements OnInit {
  protected readonly complaintStore = inject(ComplaintStore);

  protected readonly pagination = createClientPagination(this.complaintStore.complaints, 10);

  protected isModalOpen = false;
  protected readonly selected = signal<Complaint | null>(null);

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

  protected statusVariant(status: ComplaintStatus): 'secondary' | 'success' | 'warning' | 'danger' {
    const map: Record<ComplaintStatus, 'secondary' | 'success' | 'warning' | 'danger'> = {
      open: 'warning',
      in_progress: 'secondary',
      resolved: 'success',
      closed: 'secondary'
    };
    return map[status] ?? 'secondary';
  }

  protected statusLabel(status: ComplaintStatus): string {
    const map: Record<ComplaintStatus, string> = {
      open: 'Terbuka',
      in_progress: 'Diproses',
      resolved: 'Selesai',
      closed: 'Ditutup'
    };
    return map[status] ?? status;
  }
}
