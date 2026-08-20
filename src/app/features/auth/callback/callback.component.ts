import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="bx bx-loader-alt bx-spin text-4xl text-primary-600 mb-4"></i>
        <h2 class="text-lg font-medium text-slate-700">Menyelesaikan Autentikasi...</h2>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  async ngOnInit() {
    try {
      const success = await this.authStore.initializeSession();
      if (success) {
        if (this.authStore.isAdmin()) {
          this.router.navigate(['/admin'], { replaceUrl: true });
        } else {
          this.router.navigate(['/'], { replaceUrl: true });
        }
      } else {
        this.alertService.error('Gagal menyelesaikan autentikasi.');
        this.router.navigate(['/404']);
      }
    } catch {
      this.alertService.error('Terjadi kesalahan saat memproses sesi.');
      this.router.navigate(['/404']);
    }
  }
}
