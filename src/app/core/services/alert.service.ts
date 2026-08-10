import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private readonly swalConfig = {
    buttonsStyling: false,
    width: '25rem',
    padding: '1.25rem',
    customClass: {
      popup: 'rounded-2xl border border-slate-200 shadow-xl p-6 font-sans bg-white',
      title: 'text-sm font-extrabold text-slate-800 font-display tracking-tight mb-2',
      htmlContainer: 'text-xs text-slate-500 mb-4 font-medium',
      confirmButton: 'px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all rounded-xl cursor-pointer mr-2.5 outline-none',
      cancelButton: 'px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 rounded-xl cursor-pointer outline-none'
    }
  };

  async confirm(title: string, text: string, confirmButtonText = 'Ya, Lanjutkan'): Promise<boolean> {
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

  success(titleOrText: string, text = '') {
    const finalTitle = text ? titleOrText : 'Berhasil';
    const finalText = text ? text : titleOrText;
    
    Swal.fire({
      ...this.swalConfig,
      title: finalTitle,
      text: finalText,
      icon: 'success',
      confirmButtonText: 'Tutup'
    });
  }

  error(titleOrText: string, text = '') {
    const finalTitle = text ? titleOrText : 'Gagal';
    const finalText = text ? text : titleOrText;
    
    Swal.fire({
      ...this.swalConfig,
      title: finalTitle,
      text: finalText,
      icon: 'error',
      confirmButtonText: 'Tutup'
    });
  }

  info(titleOrText: string, text = '') {
    const finalTitle = text ? titleOrText : 'Informasi';
    const finalText = text ? text : titleOrText;
    
    Swal.fire({
      ...this.swalConfig,
      title: finalTitle,
      text: finalText,
      icon: 'info',
      confirmButtonText: 'Tutup'
    });
  }

  warning(titleOrText: string, text = '') {
    const finalTitle = text ? titleOrText : 'Peringatan';
    const finalText = text ? text : titleOrText;
    
    Swal.fire({
      ...this.swalConfig,
      title: finalTitle,
      text: finalText,
      icon: 'warning',
      confirmButtonText: 'Tutup'
    });
  }

  async prompt(title: string, inputPlaceholder = 'https://', defaultValue = ''): Promise<string | null> {
    const res = await Swal.fire({
      ...this.swalConfig,
      title,
      input: 'text',
      inputPlaceholder,
      inputValue: defaultValue,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal'
    });
    return res.isConfirmed && res.value ? res.value : null;
  }
}
