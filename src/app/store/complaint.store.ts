import { Injectable, inject, signal, computed } from '@angular/core';
import { Complaint, CreateComplaintPayload, RespondComplaintPayload, ReplyComplaintPayload } from '../core/models';
import { ComplaintApiService } from '../core/services/complaint-api.service';
import { ToastService } from '../core/services/toast.service';

interface ComplaintState {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintStore {
  private readonly complaintApi = inject(ComplaintApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<ComplaintState>({
    complaints: [],
    loading: false,
    error: null
  });

  readonly complaints = computed(() => this.state().complaints);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadComplaintsByUser(userId: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const complaints = await this.complaintApi.getComplaintsByUser(userId);
      this.state.update(s => ({ ...s, complaints, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
    }
  }

  async loadAllComplaints() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const complaints = await this.complaintApi.getAllComplaints();
      this.state.update(s => ({ ...s, complaints, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
    }
  }

  async create(payload: CreateComplaintPayload, files?: File[], options?: { showToast?: boolean }): Promise<boolean> {
    try {
      const created = await this.complaintApi.createComplaint(payload, files);
      this.state.update(s => ({ ...s, complaints: [created, ...s.complaints] }));
      if (options?.showToast !== false) {
        this.toastService.success('Komplain berhasil dikirim.');
      }
      return true;
    } catch {
      if (options?.showToast !== false) {
        this.toastService.error('Gagal mengirim komplain.');
      }
      return false;
    }
  }

  async respond(id: string, payload: RespondComplaintPayload, files?: File[], options?: { showToast?: boolean }): Promise<boolean> {
    try {
      const updated = await this.complaintApi.respondComplaint(id, payload, files);
      this.state.update(s => ({
        ...s,
        complaints: s.complaints.map(c => c.id === id ? updated : c)
      }));
      if (options?.showToast !== false) {
        this.toastService.success('Respons berhasil disimpan.');
      }
      return true;
    } catch {
      if (options?.showToast !== false) {
        this.toastService.error('Gagal menyimpan respons.');
      }
      return false;
    }
  }

  async reply(id: string, payload: ReplyComplaintPayload, files?: File[], options?: { showToast?: boolean }): Promise<boolean> {
    try {
      const updated = await this.complaintApi.replyComplaint(id, payload, files);
      this.state.update(s => ({
        ...s,
        complaints: s.complaints.map(c => c.id === id ? updated : c)
      }));
      if (options?.showToast !== false) {
        this.toastService.success('Balasan berhasil dikirim.');
      }
      return true;
    } catch {
      if (options?.showToast !== false) {
        this.toastService.error('Gagal mengirim balasan.');
      }
      return false;
    }
  }
}
