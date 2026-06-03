import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

import { ViewportService } from '../../../core/services/viewport.service';
import { RegisterDesktopComponent } from './register-desktop';
import { RegisterMobileComponent } from './register-mobile';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    RegisterDesktopComponent,
    RegisterMobileComponent
  ],
  templateUrl: './register.html'
})
export class RegisterPage {
  protected readonly viewport = inject(ViewportService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';

  isLoading = signal(false);

  onSubmit() {
    // Basic Validations
    if (!this.name || !this.email || !this.phone || !this.password || !this.confirmPassword) {
      this.toastService.showError('Silakan lengkapi semua kolom.');
      return;
    }

    if (this.password.length < 6) {
      this.toastService.showError('Kata sandi minimal berisi 6 karakter.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastService.showError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register({
      name: this.name,
      email: this.email,
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastService.showSuccess(`Registrasi sukses! Selamat datang, ${user.name}.`);
        this.router.navigate(['/account/profile']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.showError(err.message || 'Gagal mendaftar akun.');
      }
    });
  }
}
