import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

import { ViewportService } from '../../../core/services/viewport.service';
import { ProfileDesktopComponent } from './profile-desktop';
import { ProfileMobileComponent } from './profile-mobile';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ProfileDesktopComponent,
    ProfileMobileComponent
  ],
  templateUrl: './profile.html'
})
export class ProfilePage implements OnInit {
  protected readonly viewport = inject(ViewportService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly currentUser = this.authService.currentUser;

  // Profile Form Model
  name = '';
  phone = '';
  isSavingProfile = signal(false);

  // Password Form Model
  oldPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  isChangingPassword = signal(false);

  ngOnInit() {
    const current = this.currentUser();
    if (current) {
      this.name = current.name;
      this.phone = current.phone;
    }
  }

  onSaveProfile() {
    if (!this.name || !this.phone) {
      this.toastService.showError('Silakan lengkapi nama dan telepon Anda.');
      return;
    }

    this.isSavingProfile.set(true);

    this.authService.updateProfile(this.name, this.phone).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.toastService.showSuccess('Profil Anda berhasil diperbarui.');
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.toastService.showError(err.message || 'Gagal menyimpan profil.');
      }
    });
  }

  onChangePassword() {
    if (!this.oldPassword || !this.newPassword || !this.confirmNewPassword) {
      this.toastService.showError('Silakan lengkapi kolom perubahan kata sandi.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.showError('Kata sandi baru minimal berisi 6 karakter.');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.toastService.showError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    const current = this.currentUser();
    if (current && this.oldPassword !== current.password) {
      this.toastService.showError('Kata sandi lama Anda salah.');
      return;
    }

    this.isChangingPassword.set(true);

    // Simulate delay
    setTimeout(() => {
      this.isChangingPassword.set(false);
      this.toastService.showSuccess('Kata sandi Anda berhasil diperbarui secara aman.');
      
      // Reset form
      this.oldPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    }, 800);
  }
}
