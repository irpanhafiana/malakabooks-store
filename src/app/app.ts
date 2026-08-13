import { Component, signal, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { OfflineBannerComponent } from './shared/ui/offline-banner/offline-banner.component';
import { AuthStore } from './store/auth.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, OfflineBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('SS Online Shop');
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authStore.currentUser();
      const currentUrl = this.router.url;
      if (user && this.authStore.isAdmin() && !currentUrl.includes('/admin')) {
        console.log('[App Root] Admin terdeteksi di halaman non-admin, mengalihkan ke /admin');
        this.router.navigate(['/admin'], { replaceUrl: true });
      }
    });
  }
}
