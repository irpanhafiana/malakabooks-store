import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { OrderStore } from '../../store/order.store';
import { ComplaintStore } from '../../store/complaint.store';
import { ComplaintStatus } from '../../core/models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { TextareaComponent } from '../../shared/ui/textarea/textarea.component';

@Component({
  selector: 'app-complaint',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    BadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
    ButtonComponent,
    ModalComponent,
    InputComponent,
    TextareaComponent
  ],
  templateUrl: './complaint.component.html',
  styleUrl: './complaint.component.css'
})
export class ComplaintComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly complaintStore = inject(ComplaintStore);
  private readonly fb = inject(FormBuilder);

  protected isFormOpen = false;
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group({
    orderId: ['', Validators.required],
    subject: ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (user) {
      this.complaintStore.loadByUser(user.id);
      this.orderStore.loadUserOrders(user.id);
    }
  }

  protected openForm() {
    this.form.reset({ orderId: '', subject: '', description: '' });
    this.isFormOpen = true;
  }

  protected closeForm() {
    this.isFormOpen = false;
  }

  protected async submitComplaint() {
    if (this.form.invalid) return;
    const user = this.authStore.currentUser();
    if (!user) return;

    this.submitting.set(true);
    const { orderId, subject, description } = this.form.value;
    const ok = await this.complaintStore.create({
      userId: user.id,
      orderId: orderId!,
      subject: subject!.trim(),
      description: description!.trim()
    });
    this.submitting.set(false);
    if (ok) this.closeForm();
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
