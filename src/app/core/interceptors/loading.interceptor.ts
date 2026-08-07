import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs/operators';
import { isPosApiUrl } from '../auth/pos-session.util';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Halaman POS memuat master data secara chunked (ratusan request beruntun)
  // dan punya indikatornya sendiri. Overlay global akan berkedip terus-menerus.
  if (isPosApiUrl(req.url)) {
    return next(req);
  }

  const loadingService = inject(LoadingService);
  loadingService.show();
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
