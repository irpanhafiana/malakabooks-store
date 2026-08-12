import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { readReturnUrl } from '../auth/return-url.util';

@Component({
  selector: 'app-login-redirect',
  standalone: true,
  template: ''
})
export class LoginRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    // Hanya tercapai bila guard lolos, artinya sesi sudah aktif.
    // Tugasnya memindahkan user dari /auth/login ke tujuan aslinya.
    const returnUrl = readReturnUrl(this.route.snapshot.queryParamMap);
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      return;
    }

    const fallback = this.router.url.includes('admin') ? '/admin' : '/';
    this.router.navigate([fallback], { replaceUrl: true });
  }
}
