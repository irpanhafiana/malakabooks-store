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
import { AlertService } from '../../../core/services/alert.service';

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
    TextareaComponent
  ],
  template: `
    <div class="animate-fade-in flex flex-col gap-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 shadow-xs">
        <h2 class="font-display font-bold text-slate-800 text-sm">Complaints Manager</h2>
        <span class="text-xs text-slate-400 font-semibold">
          Total: {{ complaintStore.complaints().length }}
        </span>
      </div>

      <!-- Table -->
      @if (complaintStore.loading()) {
        <div class="p-8 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100 shadow-xs">
          Loading complaints...
        </div>
      } @else {
        <app-table>
          <tr table-headers>
            <th class="px-5 py-3">User ID</th>
            <th class="px-5 py-3">Subject</th>
            <th class="px-5 py-3">Order ID</th>
            <th class="px-5 py-3">Date</th>
            <th class="px-5 py-3">Status</th>
            <th class="px-5 py-3 text-right">Action</th>
          </tr>

          <ng-container table-rows>
            @for (c of complaintStore.complaints(); track c.id) {
              <tr class="hover:bg-slate-50/30 text-xs">
                <td class="px-5 py-4 font-mono text-slate-500 text-[10px]">{{ c.userId }}</td>
                <td class="px-5 py-4 font-bold text-slate-800 max-w-[180px]">
                  <p class="truncate">{{ c.subject }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ c.description }}</p>
                </td>
                <td class="px-5 py-4 font-mono text-slate-500 text-[10px]">{{ c.orderId }}</td>
                <td class="px-5 py-4 text-slate-600">{{ c.createdAt | date:'shortDate' }}</td>
                <td class="px-5 py-4">
                  <app-badge [variant]="statusVariant(c.status)">{{ statusLabel(c.status) }}</app-badge>
                </td>
                <td class="px-5 py-4 text-right">
                  <app-button size="sm" variant="outline" (click)="openRespond(c)">
                    Respons
                  </app-button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-5 py-10 text-center text-slate-400 text-xs">
                  Tidak ada komplain yang masuk.
                </td>
              </tr>
            }
          </ng-container>
        </app-table>
      }
    </div>

    <!-- Respond Modal -->
    <app-modal title="Respons Komplain" [(isOpen)]="isModalOpen" [hasFooter]="false">
      @if (selected()) {
        <div class="flex flex-col gap-4">
          <!-- Complaint detail summary -->
          <div class="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 flex flex-col gap-1.5">
            <p><strong>Subjek:</strong> {{ selected()!.subject }}</p>
            <p><strong>Deskripsi:</strong> {{ selected()!.description }}</p>
            <p><strong>Order ID:</strong> {{ selected()!.orderId }}</p>
          </div>

          <form [formGroup]="respondForm" (ngSubmit)="submitRespond()" class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Ubah Status
              </label>
              <select
                formControlName="status"
                class="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary-400"
              >
                <option value="open">Terbuka</option>
                <option value="in_progress">Diproses</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </div>

            <app-textarea
              label="Respons Admin"
              placeholder="Tulis respons untuk pelanggan..."
              [control]="respondForm.controls.adminResponse"
              [rows]="4"
            ></app-textarea>

            <div class="flex gap-3 pt-1">
              <app-button type="button" variant="outline" class="flex-1" (click)="closeModal()">
                Batal
              </app-button>
              <app-button
                type="submit"
                class="flex-1"
                [disabled]="respondForm.invalid"
                [loading]="submitting()"
              >
                Simpan Respons
              </app-button>
            </div>
          </form>
        </div>
      }
    </app-modal>
  `
})
export class ComplaintsCrudComponent implements OnInit {
  protected readonly complaintStore = inject(ComplaintStore);
  private readonly fb = inject(FormBuilder);
  private readonly alertService = inject(AlertService);

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
