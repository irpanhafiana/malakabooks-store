import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ComplaintStore } from '../../../store/complaint.store';
import { Complaint, ComplaintStatus, RespondComplaintPayload } from '../../../core/models';
import { TableComponent } from '../../../shared/ui/table/table.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { AlertService } from '../../../core/services/alert.service';
import { createClientPagination } from '../../../shared/util/pagination.util';

@Component({
  selector: 'app-complaints-crud',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableComponent,
    BadgeComponent,
    ButtonComponent,
    ModalComponent,
    TextareaComponent,
    PaginationComponent
  ],
  templateUrl: './complaints-crud.component.html',
  styleUrl: './complaints-crud.component.css'
})
export class ComplaintsCrudComponent implements OnInit {
  protected readonly complaintStore = inject(ComplaintStore);
  private readonly fb = inject(FormBuilder);
  private readonly alertService = inject(AlertService);

  protected readonly pagination = createClientPagination(this.complaintStore.complaints, 10);

  protected isModalOpen = false;
  protected readonly submitting = signal(false);
  protected readonly selected = signal<Complaint | null>(null);

  protected readonly respondForm = this.fb.group({
    status: ['open' as ComplaintStatus, Validators.required],
    adminResponse: ['', Validators.required]
  });

  ngOnInit() {
    this.complaintStore.loadAll();
  }

  protected openRespond(complaint: Complaint) {
    this.selected.set(complaint);
    this.respondForm.reset({
      status: complaint.status,
      adminResponse: complaint.adminResponse || ''
    });
    this.isModalOpen = true;
  }

  protected closeModal() {
    this.isModalOpen = false;
  }

  protected async submitRespond() {
    if (this.respondForm.invalid) {
      this.respondForm.markAllAsTouched();
      return;
    }
    if (!this.selected()) return;

    const isConfirmed = await this.alertService.confirm(
      'Kirim Respons?',
      'Apakah Anda yakin ingin mengirim respons untuk pelanggan ini?'
    );
    if (!isConfirmed) return;

    this.submitting.set(true);
    const { status, adminResponse } = this.respondForm.value;
    const ok = await this.complaintStore.respond(this.selected()!.id, {
      status: status as ComplaintStatus,
      adminResponse: adminResponse!.trim()
    });
    this.submitting.set(false);
    if (ok) {
      this.closeModal();
      this.alertService.success('Berhasil!', 'Respons komplain berhasil dikirim.');
    }
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
