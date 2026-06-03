import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private activeToasts = signal<ToastMessage[]>([]);

  readonly toasts = this.activeToasts.asReadonly();

  show(type: ToastMessage['type'], message: string, duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { id, type, message, duration };
    
    this.activeToasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  showSuccess(message: string, duration = 3000) {
    this.show('success', message, duration);
  }

  showError(message: string, duration = 3000) {
    this.show('error', message, duration);
  }

  showInfo(message: string, duration = 3000) {
    this.show('info', message, duration);
  }

  dismiss(id: string) {
    this.activeToasts.update((current) => current.filter((t) => t.id !== id));
  }
}
