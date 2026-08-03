import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly router = inject(Router);

  // Custom Modal States (signals)
  isOpen = signal<boolean>(false);
  title = signal<string>('');
  text = signal<string>('');
  type = signal<'success' | 'error' | 'confirm'>('success');
  confirmButtonText = signal<string>('Ya, Lanjutkan');
  cancelButtonText = signal<string>('Batal');

  private resolveFn: ((value: boolean) => void) | null = null;

  private readonly swalConfig = {
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl p-6 font-sans bg-white',
      title: 'text-sm font-extrabold text-slate-800 font-display tracking-tight mb-2',
      htmlContainer: 'text-xs text-slate-500 mb-4 font-medium',
      confirmButton: 'px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all rounded-xl cursor-pointer mr-2.5 outline-none',
      cancelButton: 'px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 rounded-xl cursor-pointer outline-none'
    }
  };

  private isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  async confirm(title: string, text: string, confirmButtonText: string = 'Ya, Lanjutkan'): Promise<boolean> {
    if (this.isAdminRoute()) {
      const res = await Swal.fire({
        ...this.swalConfig,
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'Batal'
      });
      return res.isConfirmed;
    } else {
      if (this.resolveFn) {
        this.resolveFn(false);
        this.resolveFn = null;
      }

      this.title.set(title);
      this.text.set(text);
      this.type.set('confirm');
      this.confirmButtonText.set(confirmButtonText);
      this.cancelButtonText.set('Batal');
      this.isOpen.set(true);

      return new Promise<boolean>((resolve) => {
        this.resolveFn = resolve;
      });
    }
  }

  success(title: string, text: string) {
    if (this.isAdminRoute()) {
      Swal.fire({
        ...this.swalConfig,
        title,
        text,
        icon: 'success',
        confirmButtonText: 'Tutup'
      });
    } else {
      this.title.set(title);
      this.text.set(text);
      this.type.set('success');
      this.isOpen.set(true);
    }
  }

  error(title: string, text: string) {
    if (this.isAdminRoute()) {
      Swal.fire({
        ...this.swalConfig,
        title,
        text,
        icon: 'error',
        confirmButtonText: 'Tutup'
      });
    } else {
      this.title.set(title);
      this.text.set(text);
      this.type.set('error');
      this.isOpen.set(true);
    }
  }

  close(value: boolean) {
    this.isOpen.set(false);
    if (this.resolveFn) {
      this.resolveFn(value);
      this.resolveFn = null;
    }
  }
}
