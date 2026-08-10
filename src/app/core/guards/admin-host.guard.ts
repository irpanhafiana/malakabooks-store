import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminHostGuard: CanActivateFn = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Izinkan localhost / IP lokal untuk testing development
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    
    // Jika diakses dari domain publik (bukan subdomain admin), tampilkan 404 Not Found (kembalikan ke home / 404)
    if (!isLocalhost && !hostname.startsWith('admin')) {
      const router = inject(Router);
      router.navigate(['/404']);
      return false;
    }
  }
  return true;
};
