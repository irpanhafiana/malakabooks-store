import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { OrderStore } from '../../store/order.store';
import { ComplaintStore } from '../../store/complaint.store';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { TextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-complaint',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
    ButtonComponent,
    BottomSheetComponent,
    InputComponent,
    TextareaComponent
  ],
  templateUrl: './complaint.component.html',
  styleUrl: './complaint.component.css'
})
export class ComplaintComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly complaintStore = inject(ComplaintStore);

  protected isFormOpen = signal<boolean>(false);
  protected readonly submitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    orderId: ['', Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (user) {
      this.complaintStore.loadComplaintsByUser(user.id);
      this.orderStore.loadUserOrders(user.id);
    }
  }

  protected openForm() {
    this.form.reset({ orderId: '', subject: '', description: '' });
    this.isFormOpen.set(true);
  }

  protected closeForm() {
    this.isFormOpen.set(false);
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
    if (ok) this.isFormOpen.set(false);
  }
}
