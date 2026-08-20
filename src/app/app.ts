import { Component, signal, ChangeDetectionStrategy, inject, effect, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { OfflineBannerComponent } from './shared/ui/offline-banner/offline-banner.component';
import { AuthStore } from './store/auth.store';
import { AlertService } from './core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, OfflineBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Kopi Mardika');
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  constructor() {
    effect(() => {
      const user = this.authStore.currentUser();
      const currentUrl = this.router.url;
      if (user && this.authStore.isAdmin() && !currentUrl.includes('/admin')) {
        console.log('[App Root] Admin terdeteksi di halaman non-admin, mengalihkan ke halaman admin');
        this.router.navigate(['/admin'], { replaceUrl: true });
      }
    });
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('loggedOut') === 'true') {
        // Tampilkan pesan logout sukses dari server
        this.alertService.info('Anda telah keluar.');

        // Bersihkan parameter dari URL agar pesan tidak muncul berulang saat refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }
}
