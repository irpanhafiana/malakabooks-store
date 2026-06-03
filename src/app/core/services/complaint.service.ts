import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Complaint } from '../models/complaint.model';
import { COMPLAINTS_DATA } from '../data/complaints.data';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private readonly COMPLAINTS_KEY = 'malaka_complaints';

  private complaints = signal<Complaint[]>([]);

  constructor() {
    this.initComplaints();
  }

  private initComplaints() {
    const stored = localStorage.getItem(this.COMPLAINTS_KEY);
    if (stored) {
      this.complaints.set(JSON.parse(stored));
    } else {
      this.complaints.set(COMPLAINTS_DATA);
      localStorage.setItem(this.COMPLAINTS_KEY, JSON.stringify(COMPLAINTS_DATA));
    }
  }

  getAll(): Observable<Complaint[]> {
    return of(this.complaints()).pipe(delay(300));
  }

  getByUser(userId: string): Observable<Complaint[]> {
    const list = this.complaints().filter((c) => c.userId === userId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return of(list).pipe(delay(250));
  }

  getById(id: string): Observable<Complaint | undefined> {
    const complaint = this.complaints().find((c) => c.id === id);
    return of(complaint).pipe(delay(150));
  }

  createComplaint(
    userId: string,
    orderId: string,
    subject: string,
    description: string
  ): Observable<Complaint> {
    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      userId,
      orderId,
      subject,
      description,
      status: 'open',
      adminResponse: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newComplaint, ...this.complaints()];
    this.complaints.set(updated);
    localStorage.setItem(this.COMPLAINTS_KEY, JSON.stringify(updated));

    return of(newComplaint).pipe(delay(300));
  }

  respond(id: string, adminResponse: string, status: Complaint['status']): Observable<Complaint> {
    const compIndex = this.complaints().findIndex((c) => c.id === id);
    if (compIndex === -1) {
      return throwError(() => new Error('Komplain tidak ditemukan.')).pipe(delay(150));
    }

    const current = this.complaints()[compIndex];
    const updatedComplaint: Complaint = {
      ...current,
      adminResponse,
      status,
      updatedAt: new Date().toISOString()
    };

    const updatedList = this.complaints().map((c) => (c.id === id ? updatedComplaint : c));
    this.complaints.set(updatedList);
    localStorage.setItem(this.COMPLAINTS_KEY, JSON.stringify(updatedList));

    return of(updatedComplaint).pipe(delay(250));
  }

  updateStatus(id: string, status: Complaint['status']): Observable<Complaint> {
    const compIndex = this.complaints().findIndex((c) => c.id === id);
    if (compIndex === -1) {
      return throwError(() => new Error('Komplain tidak ditemukan.')).pipe(delay(150));
    }

    const current = this.complaints()[compIndex];
    const updatedComplaint: Complaint = {
      ...current,
      status,
      updatedAt: new Date().toISOString()
    };

    const updatedList = this.complaints().map((c) => (c.id === id ? updatedComplaint : c));
    this.complaints.set(updatedList);
    localStorage.setItem(this.COMPLAINTS_KEY, JSON.stringify(updatedList));

    return of(updatedComplaint).pipe(delay(200));
  }
}
