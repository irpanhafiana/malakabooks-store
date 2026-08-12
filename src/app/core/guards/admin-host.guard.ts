import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminHostGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Izinkan localhost / IP lokal untuk testing development
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

    // Dari domain publik (bukan subdomain admin) panel admin harus tidak dapat
    // ditemukan. Mengarahkan ke halaman login justru mengonfirmasi keberadaannya.
    if (!isLocalhost && !hostname.startsWith('admin')) {
      router.navigate(['/404']);
      return false;
    }
  }
  return true;
};
