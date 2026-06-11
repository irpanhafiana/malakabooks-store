import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Complaint, CreateComplaintPayload, RespondComplaintPayload } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComplaintApiService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapComplaint(c: any): Complaint {
    return {
      id: c.id,
      userId: c.userId,
      orderId: c.orderId,
      subject: c.subject,
      description: c.description,
      status: c.status,
      adminResponse: c.adminResponse || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };
  }

  async getComplaintsByUser(userId: string): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/customer/Complaints/user/${userId}`));
      const list = envelope?.data || [];
      return list.map((c: any) => this.mapComplaint(c));
    } catch (e) {
      console.error('Gagal mengambil complaints user:', e);
      return [];
    }
  }

  async createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
    const res = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/customer/Complaints`, payload));
    return this.mapComplaint(res?.data);
  }

  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<any>(`${this.BASE_URL}/admin/Complaints`));
      const list = envelope?.data || [];
      return list.map((c: any) => this.mapComplaint(c));
    } catch (e) {
      console.error('Gagal mengambil semua complaints (admin):', e);
      return [];
    }
  }

  async respondComplaint(id: string, payload: RespondComplaintPayload): Promise<Complaint> {
    const res = await firstValueFrom(this.http.put<any>(`${this.BASE_URL}/admin/Complaints/${id}/respond`, payload));
    return this.mapComplaint(res?.data);
  }
}
