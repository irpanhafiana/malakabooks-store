import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { environment } from '../../../environments/environment';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn()) {
    if (authStore.isAdmin()) {
      return true;
    }
    // Redirect authenticated non-admins to customer homepage
    router.navigate(['/']);
    return false;
  }

  // Redirect unauthenticated admin requests to BFF admin login (with client_type param if needed)
  window.location.href = environment.authUrl + '?returnUrl=/admin&client_type=admin';
  return false;
};
