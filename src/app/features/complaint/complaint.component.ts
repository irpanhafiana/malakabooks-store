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
  template: `
    <div class="animate-fade-in pb-12">
      <div class="flex items-center justify-between mb-6">
        <h1 class="font-display font-extrabold text-slate-800 text-xl">Komplain Saya</h1>
        <app-button size="sm" (click)="openForm()">
          <i class="bx bx-plus mr-1"></i> Ajukan
        </app-button>
      </div>

      @if (complaintStore.loading()) {
        <div class="flex flex-col gap-4">
          <app-skeleton type="table-row" [count]="3"></app-skeleton>
        </div>
      } @else if (complaintStore.complaints().length === 0) {
        <app-empty-state
          icon="message-square-error"
          title="Belum Ada Komplain"
          description="Jika ada masalah dengan pesanan, Anda dapat mengajukan komplain di sini."
          actionText="Lihat Pesanan"
          routerLink="/order-history"
        ></app-empty-state>
      } @else {
        <div class="flex flex-col gap-4">
          @for (c of complaintStore.complaints(); track c.id) {
            <div class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold text-slate-800 text-sm">{{ c.subject }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Order #{{ c.orderId }} &middot; {{ c.createdAt | date:'mediumDate' }}
                  </p>
                </div>
                <app-badge [variant]="statusVariant(c.status)">{{ statusLabel(c.status) }}</app-badge>
              </div>

              <p class="text-xs text-slate-600">{{ c.description }}</p>

              @if (c.adminResponse) {
                <div class="bg-primary-50 border border-primary-100 rounded-2xl p-3 text-xs text-primary-800">
                  <p class="font-semibold mb-0.5">Respons Admin:</p>
                  <p>{{ c.adminResponse }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Form Modal -->
    <app-modal title="Ajukan Komplain" [(isOpen)]="isFormOpen" [hasFooter]="false">
      <form [formGroup]="form" (ngSubmit)="submitComplaint()" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Pesanan Terkait
          </label>
          <select
            formControlName="orderId"
            class="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary-400"
          >
            <option value="" disabled>Pilih pesanan...</option>
            @for (order of orderStore.orders(); track order.id) {
              <option [value]="order.id">#{{ order.id }} — {{ order.orderDate | date:'shortDate' }}</option>
            }
          </select>
        </div>

        <app-input
          label="Subjek"
          placeholder="Contoh: Buku belum sampai"
          [control]="form.controls.subject"
        ></app-input>

        <app-textarea
          label="Deskripsi"
          placeholder="Jelaskan masalah Anda secara detail..."
          [control]="form.controls.description"
          [rows]="4"
        ></app-textarea>

        <div class="flex gap-3 pt-1">
          <app-button type="button" variant="outline" class="flex-1" (click)="closeForm()">
            Batal
          </app-button>
          <app-button
            type="submit"
            class="flex-1"
            [disabled]="form.invalid"
            [loading]="submitting()"
          >
            Kirim Komplain
          </app-button>
        </div>
      </form>
    </app-modal>
  `
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
