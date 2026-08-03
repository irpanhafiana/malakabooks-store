import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn()) {
    return true;
  }

  // Redirect to login page with returnUrl preserved
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
