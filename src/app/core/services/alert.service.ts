import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly swalConfig = {
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-3xl border border-slate-200/50 shadow-xl p-6 font-sans bg-white',
      title: 'text-sm font-extrabold text-slate-800 font-display tracking-tight mb-2',
      htmlContainer: 'text-xs text-slate-500 mb-4 font-medium',
      confirmButton: 'px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl  cursor-pointer mr-2.5 outline-none',
      cancelButton: 'px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-xl  cursor-pointer outline-none'
    }
  };

  async confirm(title: string, text: string, confirmButtonText: string = 'Ya, Lanjutkan'): Promise<boolean> {
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
  }

  success(title: string, text: string) {
    Swal.fire({
      ...this.swalConfig,
      title,
      text,
      icon: 'success',
      confirmButtonText: 'Tutup'
    });
  }

  error(title: string, text: string) {
    Swal.fire({
      ...this.swalConfig,
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Tutup'
    });
  }
}
