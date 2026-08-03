import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Complaint, CreateComplaintPayload, RespondComplaintPayload, ReplyComplaintPayload, ApiResponse, ComplaintResponseDto } from '../models';
import { ComplaintStatus } from '../models';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ComplaintApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly BASE_URL = environment.apiBaseUrl;

  private mapComplaint(c: ComplaintResponseDto): Complaint {
    return {
      id: c.id,
      userId: c.userId,
      orderId: c.orderId,
      itemId: c.itemId,
      subject: c.subject,
      description: c.description,
      status: c.status as ComplaintStatus,
      additionalImages: c.additionalImages || [],
      messages: c.messages || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };
  }

  private createFormDataWithFiles(fields: Record<string, string>, files?: File[]): FormData {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, val]) => {
      formData.append(key, val || '');
    });
    if (files && files.length > 0) {
      files.forEach(f => formData.append('AdditionalImages', f));
    }
    return formData;
  }

  async getComplaintsByUser(userId: string): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<ApiResponse<ComplaintResponseDto[]>>(`${this.BASE_URL}/customer/Complaints/user/${userId}`));
      const list = envelope?.data || [];
      return list.map(c => this.mapComplaint(c));
    } catch (e) {
      this.logger.error('ComplaintApiService.getComplaintsByUser', 'Gagal mengambil complaints user:', e);
      return [];
    }
  }

  async createComplaint(payload: CreateComplaintPayload, files?: File[]): Promise<Complaint> {
    if (files && files.length > 0) {
      const formData = this.createFormDataWithFiles({
        UserId: payload.userId || '',
        OrderId: payload.orderId || '',
        ItemId: payload.itemId || '',
        Subject: payload.subject || '',
        Description: payload.description || ''
      }, files);

      const res = await firstValueFrom(this.http.post<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/customer/Complaints/with-files`, formData));
      return this.mapComplaint(res.data);
    }

    const res = await firstValueFrom(this.http.post<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/customer/Complaints`, payload));
    return this.mapComplaint(res.data);
  }

  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const envelope = await firstValueFrom(this.http.get<ApiResponse<ComplaintResponseDto[]>>(`${this.BASE_URL}/admin/Complaints`));
      const list = envelope?.data || [];
      return list.map(c => this.mapComplaint(c));
    } catch (e) {
      this.logger.error('ComplaintApiService.getAllComplaints', 'Gagal mengambil semua complaints (admin):', e);
      return [];
    }
  }

  async respondComplaint(id: string, payload: RespondComplaintPayload, files?: File[]): Promise<Complaint> {
    if (files && files.length > 0) {
      const formData = this.createFormDataWithFiles({ Message: payload.message || '' }, files);

      const res = await firstValueFrom(this.http.put<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/admin/Complaints/${id}/respond/with-files`, formData));
      return this.mapComplaint(res.data);
    }

    const res = await firstValueFrom(this.http.put<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/admin/Complaints/${id}/respond`, payload));
    return this.mapComplaint(res.data);
  }

  async replyComplaint(id: string, payload: ReplyComplaintPayload, files?: File[]): Promise<Complaint> {
    if (files && files.length > 0) {
      const formData = this.createFormDataWithFiles({ Message: payload.message || '' }, files);

      const res = await firstValueFrom(this.http.put<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/customer/Complaints/${id}/reply/with-files`, formData));
      return this.mapComplaint(res.data);
    }

    const res = await firstValueFrom(this.http.put<ApiResponse<ComplaintResponseDto>>(`${this.BASE_URL}/customer/Complaints/${id}/reply`, payload));
    return this.mapComplaint(res.data);
  }
}
