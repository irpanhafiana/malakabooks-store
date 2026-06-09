import { Injectable, inject, signal, computed } from '@angular/core';
import { Complaint, CreateComplaintPayload, RespondComplaintPayload } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

interface ComplaintState {
  complaints: Complaint[];
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintStore {
  private readonly apiService = inject(ApiService);
  private readonly toastService = inject(ToastService);

  private readonly state = signal<ComplaintState>({
    complaints: [],
    loading: false
  });

  readonly complaints = computed(() => this.state().complaints);
  readonly loading = computed(() => this.state().loading);

  async loadByUser(userId: string) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const complaints = await this.apiService.getComplaintsByUser(userId);
      this.state.update(s => ({ ...s, complaints, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal memuat daftar komplain.');
    }
  }

  async loadAll() {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      const complaints = await this.apiService.getAllComplaints();
      this.state.update(s => ({ ...s, complaints, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false }));
      this.toastService.error('Gagal memuat semua komplain.');
    }
  }

  async create(payload: CreateComplaintPayload): Promise<boolean> {
    try {
      const created = await this.apiService.createComplaint(payload);
      this.state.update(s => ({ ...s, complaints: [created, ...s.complaints] }));
      this.toastService.success('Komplain berhasil dikirim.');
      return true;
    } catch {
      this.toastService.error('Gagal mengirim komplain.');
      return false;
    }
  }

  async respond(id: string, payload: RespondComplaintPayload): Promise<boolean> {
    try {
      const updated = await this.apiService.respondComplaint(id, payload);
      this.state.update(s => ({
        ...s,
        complaints: s.complaints.map(c => c.id === id ? updated : c)
      }));
      this.toastService.success('Respons berhasil disimpan.');
      return true;
    } catch {
      this.toastService.error('Gagal menyimpan respons.');
      return false;
    }
  }
}
