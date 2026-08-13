import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { readReturnUrl } from '../auth/return-url.util';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  template: ''
})
export class LoginRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);

  ngOnInit() {
    // Hanya tercapai bila guard lolos, artinya sesi sudah aktif.
    // Tugasnya memindahkan user dari /auth/login ke tujuan aslinya.
    const returnUrl = readReturnUrl(this.route.snapshot.queryParamMap);
    const sanitizedReturn = returnUrl && !returnUrl.includes('/auth/login') && returnUrl !== '/' ? returnUrl : null;
    if (sanitizedReturn) {
      this.router.navigateByUrl(sanitizedReturn, { replaceUrl: true });
      return;
    }

    const fallback = (this.router.url.includes('admin') || this.authStore.isAdmin()) ? '/admin' : '/profile';
    this.router.navigate([fallback], { replaceUrl: true });
  }
}
