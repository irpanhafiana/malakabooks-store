import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PosAuthService } from '../services/pos-auth.service';

/**
 * Menjaga halaman /admin/pos/* — kasir butuh sesi gateway POS (SAP) sendiri,
 * di atas sesi admin MalakaBooks yang sudah dijamin oleh adminGuard.
 */
export const posGuard: CanActivateFn = (_route, state) => {
  const posAuth = inject(PosAuthService);
  const router = inject(Router);

  if (posAuth.getToken()) {
    return true;
  }

  router.navigate(['/admin/pos/login'], { queryParams: { redirect: state.url } });
  return false;
};
