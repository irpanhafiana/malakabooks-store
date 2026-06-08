import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn() && authStore.isAdmin()) {
    return true;
  }

  // Redirect unauthorized users to customer homepage
  router.navigate(['/']);
  return false;
};
