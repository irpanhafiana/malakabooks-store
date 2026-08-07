import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KatalogToastService {
  currentToast = signal<ToastMessage | null>(null);
  visible = signal<boolean>(false);

  show(title: string, message?: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
    this.currentToast.set({ title, message, type });
    this.visible.set(true);

    setTimeout(() => {
      this.visible.set(false);
      setTimeout(() => {
        this.currentToast.set(null);
      }, 300);
    }, duration);
  }

  success(title: string, message?: string, duration?: number) {
    this.show(title, message, 'success', duration);
  }

  error(title: string, message?: string, duration?: number) {
    this.show(title, message, 'error', duration);
  }

  info(title: string, message?: string, duration?: number) {
    this.show(title, message, 'info', duration);
  }
}
