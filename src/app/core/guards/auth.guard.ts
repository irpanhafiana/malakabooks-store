import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { getBffLoginUrl } from '../auth/login-url.util';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authStore = inject(AuthStore);

  if (authStore.isLoggedIn()) {
    return true;
  }

  // Redirect to BFF login page
  window.location.href = getBffLoginUrl('/auth/callback');
  return false;
};
