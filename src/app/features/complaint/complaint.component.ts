import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
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
import { OrderApiService } from '../../core/services/order-api.service';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

import { ScreenService } from '../../core/services/screen.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-complaint',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
    ButtonComponent,
    BottomSheetComponent,
    InputComponent,
    TextareaComponent,
    ModalComponent
  ],
  templateUrl: './complaint.component.html',
  styleUrl: './complaint.component.css'
})
export class ComplaintComponent implements OnInit {
  protected readonly screen = inject(ScreenService);
  private readonly fb = inject(FormBuilder);
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  protected readonly complaintStore = inject(ComplaintStore);
  private readonly orderApi = inject(OrderApiService);

  protected isFormOpen = signal<boolean>(false);
  protected isChatOpen = signal<boolean>(false);
  protected selectedComplaint = signal<any>(null);
  protected readonly submitting = signal<boolean>(false);
  protected readonly replying = signal<boolean>(false);
  protected previewImage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    orderId: ['', Validators.required],
    itemId: ['', Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  protected readonly replyControl = this.fb.control('', Validators.required);
  protected complaintImages = signal<{no: number, image: string}[]>([]);
  protected replyImages = signal<{no: number, image: string}[]>([]);
  protected selectedOrderItems = signal<any[]>([]);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (user) {
      this.complaintStore.loadComplaintsByUser(user.id);
      this.orderStore.loadUserOrders(user.id);
    }
  }

  async onOrderChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const orderId = target.value;
    if (orderId) {
      this.form.controls.itemId.reset();
      this.form.controls.itemId.setValue('');
      const order = await this.orderApi.getOrderById(orderId);
      if (order) {
        this.selectedOrderItems.set(order.items);
      } else {
        this.selectedOrderItems.set([]);
      }
    }
  }

  protected openForm() {
    this.form.reset({ orderId: '', itemId: '', subject: '', description: '' });
    this.complaintImages.set([]);
    this.selectedOrderItems.set([]);
    this.isFormOpen.set(true);
  }

  protected closeForm() {
    this.isFormOpen.set(false);
  }

  protected openImagePreview(url: string) {
    this.previewImage.set(url);
  }

  protected closeImagePreview() {
    this.previewImage.set(null);
  }

  protected openChat(complaint: any) {
    this.selectedComplaint.set(complaint);
    this.replyControl.reset();
    this.replyImages.set([]);
    this.isChatOpen.set(true);
  }

  protected closeChat() {
    this.isChatOpen.set(false);
    this.selectedComplaint.set(null);
  }

  protected complaintFiles = signal<File[]>([]);
  protected replyFiles = signal<File[]>([]);

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.complaintFiles.set([...this.complaintFiles(), file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const current = this.complaintImages();
        this.complaintImages.set([...current, { no: current.length + 1, image: base64 }]);
      };
      reader.readAsDataURL(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(index: number) {
    const current = this.complaintImages();
    this.complaintImages.set(current.filter((_, i) => i !== index));
    this.complaintFiles.set(this.complaintFiles().filter((_, i) => i !== index));
  }

  onReplyImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.replyFiles.set([...this.replyFiles(), file]);
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
    this.replyFiles.set(this.replyFiles().filter((_, i) => i !== index));
  }

  protected async submitReply() {
    if (this.replyControl.invalid) return;
    const complaint = this.selectedComplaint();
    const user = this.authStore.currentUser();
    if (!complaint || !user) return;

    this.replying.set(true);
    const ok = await this.complaintStore.reply(complaint.id, {
      status: complaint.status,
      message: this.replyControl.value!.trim(),
      senderId: user.id,
      senderType: 'customer',
      additionalImages: this.replyImages()
    }, this.replyFiles());
    this.replying.set(false);
    if (ok) {
      this.replyControl.reset();
      this.replyImages.set([]);
      this.replyFiles.set([]);
      const updated = this.complaintStore.complaints().find(c => c.id === complaint.id);
      if (updated) this.selectedComplaint.set(updated);
    }
  }

  protected async submitComplaint() {
    if (this.form.invalid) return;
    const user = this.authStore.currentUser();
    if (!user) return;

    this.submitting.set(true);
    const { orderId, itemId, subject, description } = this.form.value;
    const ok = await this.complaintStore.create({
      userId: user.id,
      orderId: orderId!,
      itemId: itemId!,
      subject: subject!.trim(),
      description: description!.trim(),
      additionalImages: this.complaintImages()
    }, this.complaintFiles());
    this.submitting.set(false);
    if (ok) {
      this.isFormOpen.set(false);
      this.complaintImages.set([]);
      this.complaintFiles.set([]);
      this.selectedOrderItems.set([]);
    }
  }
}
