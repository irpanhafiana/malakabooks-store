import { Component, input, output, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Complaint, ComplaintStatus } from '../../../../core/models';
import { ComplaintStore } from '../../../../store/complaint.store';
import { AuthStore } from '../../../../store/auth.store';
import { AdminSelectComponent } from '../../../../shared/ui/admin-select/admin-select.component';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AlertService } from '../../../../core/services/alert.service';
import { effect } from '@angular/core';
import { TooltipDirective } from '../../../../shared/directives/tooltip.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-complaints-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    AdminSelectComponent, 
    TextareaComponent, 
    AdminButtonComponent,
    ModalComponent,
    TooltipDirective
  ],
  templateUrl: './complaints-form.component.html'
})
export class ComplaintsFormComponent {
  readonly complaint = input<Complaint | null>(null);
  readonly onCancel = output<void>();
  readonly onSave = output<void>();

  private readonly complaintStore = inject(ComplaintStore);
  private readonly fb = inject(FormBuilder);
  private readonly alertService = inject(AlertService);
  private readonly authStore = inject(AuthStore);

  submitting = signal(false);
  previewImage = signal<string | null>(null);
  replyImages = signal<{no: number, image: string}[]>([]);
  replyImageFiles = signal<File[]>([]);

  statusOptions = [
    { value: 'open', label: 'Terbuka' },
    { value: 'in_progress', label: 'Diproses' },
    { value: 'resolved', label: 'Selesai' },
    { value: 'closed', label: 'Ditutup' }
  ];

  respondForm = this.fb.group({
    status: ['open' as ComplaintStatus, Validators.required],
    message: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const c = this.complaint();
      if (c) {
        this.respondForm.patchValue({
          status: c.status
        });
        this.respondForm.get('message')?.reset();
      }
    });
  }

  async submitRespond() {
    if (this.respondForm.invalid) {
      this.respondForm.markAllAsTouched();
      return;
    }
    const currentComplaint = this.complaint();
    const adminUser = this.authStore.currentUser();
    if (!currentComplaint || !adminUser) return;

    const isConfirmed = await this.alertService.confirm(
      'Kirim Respons?',
      'Apakah Anda yakin ingin mengirim respons untuk pelanggan ini?'
    );
    if (!isConfirmed) return;

    this.submitting.set(true);
    const { status, message } = this.respondForm.value;
    const ok = await this.complaintStore.respond(currentComplaint.id, {
      status: status as ComplaintStatus,
      message: message!.trim(),
      senderId: adminUser.id,
      senderType: 'admin',
      additionalImages: this.replyImages()
    }, this.replyImageFiles());
    this.submitting.set(false);
    if (ok) {
      this.alertService.success('Berhasil!', 'Respons komplain berhasil dikirim.');
      this.replyImages.set([]);
      this.replyImageFiles.set([]);
      this.onSave.emit();
    }
  }

  onReplyImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.replyImageFiles.set([...this.replyImageFiles(), file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const current = this.replyImages();
        this.replyImages.set([...current, { no: current.length + 1, image: base64 }]);
      };
      reader.readAsDataURL(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeReplyImage(index: number) {
    const current = this.replyImages();
    this.replyImages.set(current.filter((_, i) => i !== index));
    this.replyImageFiles.set(this.replyImageFiles().filter((_, i) => i !== index));
  }

  protected openImagePreview(url: string) {
    this.previewImage.set(url);
  }

  protected closeImagePreview() {
    this.previewImage.set(null);
  }
}
