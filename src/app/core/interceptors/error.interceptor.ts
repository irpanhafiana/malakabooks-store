import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import type { ApiResponse } from '../models/api-response.model';

/**
 * Sertakan header ini pada request yang ingin menangani error-nya sendiri
 * (mis. pengecekan silent) agar interceptor tidak memunculkan alertService.
 */
export const SKIP_ERROR_HEADER = 'X-Skip-Error-Interceptor';

/**
 * Interceptor error terpusat. Memunculkan toast untuk kelas kegagalan yang
 * selama ini "hilang" tanpa umpan balik ke pengguna:
 *  - 0    : gagal terhubung / jaringan / CORS
 *  - 403  : token valid tapi kekurangan claim metode (GlobalHttpMethodAuthorizationFilter)
 *  - 5xx  : kesalahan server
 *
 * Sengaja TIDAK ditangani di sini (dibiarkan lewat, error tetap dilempar ulang):
 *  - 401  : domain authInterceptor (refresh + redirect login)
 *  - 400  : validasi — ditangani store/komponen yang membaca envelope `errors`
 *  - 404  : umumnya sudah diterjemahkan service menjadi list kosong/null
 *
 * Selalu melempar ulang error agar blok catch pada service tetap berjalan.
 */
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
      } else if (error.status >= 500) {
        alertService.error(serverMessage || 'Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }

      return throwError(() => error);
    })
  );
};
