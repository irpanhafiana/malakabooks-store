import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);

  if (authStore.isLoggedIn()) {
    return true;
  }

  // Redirect to BFF login page
  window.location.href = environment.authUrl + '?returnUrl=' + encodeURIComponent(state.url);
  return false;
};
