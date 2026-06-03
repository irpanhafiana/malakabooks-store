import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

import { ViewportService } from '../../../core/services/viewport.service';
import { LoginDesktopComponent } from './login-desktop';
import { LoginMobileComponent } from './login-mobile';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    LoginDesktopComponent,
    LoginMobileComponent
  ],
  templateUrl: './login.html'
})
export class LoginPage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  rememberMe = false;
  
  isLoading = signal(false);
  returnUrl = '/';

  ngOnInit() {
    // Get returnUrl from route parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toastService.showError('Silakan lengkapi semua kolom.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(`Selamat datang kembali, ${user.name}!`);
        
        // Redirect to intended url
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError(err.message || 'Email atau password salah.');
      }
    });
  }
}
