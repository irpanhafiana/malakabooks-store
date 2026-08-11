import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import type { ApiResponse } from '../models/api-response.model';

export const SKIP_ERROR_HEADER = 'X-Skip-Error-Interceptor';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has(SKIP_ERROR_HEADER)) {
    return next(req);
  }

  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Pesan dari envelope backend bila ada: { statusMessage, errors, errorType }.
      const envelope = error.error as Partial<ApiResponse<unknown>> | null | undefined;
      const serverMessage =
        envelope && typeof envelope === 'object' ? envelope.statusMessage ?? null : null;

      if (error.status === 0) {
        alertService.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else if (error.status === 400) {
        if (envelope && envelope.errors && typeof envelope.errors === 'object') {
          const validationMsgs = Object.values(envelope.errors).flat();
          if (validationMsgs.length > 0) {
            alertService.error(validationMsgs.join(', '));
          } else {
            alertService.error(serverMessage || 'Terjadi kesalahan validasi data.');
          }
        } else {
          alertService.error(serverMessage || 'Permintaan tidak valid (400).');
        }
      } else if (error.status === 403) {
        alertService.error(serverMessage || 'Anda tidak memiliki izin untuk melakukan tindakan ini.');
      } else if (error.status === 404) {
        alertService.error(serverMessage || 'Sumber daya tidak ditemukan (404).');
      } else if (error.status === 409) {
        alertService.error(serverMessage || 'Terjadi konflik data atau stok produk telah habis (409).');
      } else if (error.status === 422) {
        alertService.error(serverMessage || 'Data yang dikirimkan tidak dapat diproses oleh server (422).');
      } else if (error.status >= 500) {
        alertService.error(serverMessage || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }

      return throwError(() => error);
    })
  );
};
