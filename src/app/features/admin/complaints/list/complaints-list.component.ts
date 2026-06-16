import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ComplaintStore } from '../../../../store/complaint.store';
import { Complaint, ComplaintStatus } from '../../../../core/models';
import { TableComponent } from '../../../../shared/ui/table/table.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
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
    ButtonComponent,
    ModalComponent,
    PaginationComponent,
    ComplaintsFormComponent,
    SpinnerComponent,
    StatusBadgeComponent
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
}
