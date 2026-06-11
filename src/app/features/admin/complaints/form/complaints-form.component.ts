import { Component, inject, input, output, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ComplaintStore } from '../../../../store/complaint.store';
import { Complaint, ComplaintStatus } from '../../../../core/models';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-complaints-form',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, TextareaComponent],
  templateUrl: './complaints-form.component.html',
  styleUrl: './complaints-form.component.css'
})
export class ComplaintsFormComponent {
  complaint = input<Complaint | null>(null);
  onCancel = output<void>();
  onSave = output<void>();

  private readonly complaintStore = inject(ComplaintStore);
  private readonly fb = inject(FormBuilder);
  private readonly alertService = inject(AlertService);

  submitting = signal(false);

  respondForm = this.fb.group({
    status: ['open' as ComplaintStatus, Validators.required],
    adminResponse: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const c = this.complaint();
      if (c) {
        this.respondForm.reset({
          status: c.status,
          adminResponse: c.adminResponse || ''
        });
      }
    });
  }

  async submitRespond() {
    if (this.respondForm.invalid) {
      this.respondForm.markAllAsTouched();
      return;
    }
    const currentComplaint = this.complaint();
    if (!currentComplaint) return;

    const isConfirmed = await this.alertService.confirm(
      'Kirim Respons?',
      'Apakah Anda yakin ingin mengirim respons untuk pelanggan ini?'
    );
    if (!isConfirmed) return;

    this.submitting.set(true);
    const { status, adminResponse } = this.respondForm.value;
    const ok = await this.complaintStore.respond(currentComplaint.id, {
      status: status as ComplaintStatus,
      adminResponse: adminResponse!.trim()
    });
    this.submitting.set(false);
    if (ok) {
      this.alertService.success('Berhasil!', 'Respons komplain berhasil dikirim.');
      this.onSave.emit();
    }
  }
}
