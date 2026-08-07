import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router } from '@angular/router';
import { KatalogBottomNavComponent } from '../../features/katalog/components/katalog-bottom-nav/katalog-bottom-nav.component';
import { KatalogHeaderComponent } from '../../features/katalog/components/katalog-header/katalog-header.component';
import { KatalogToastService } from '../../core/services/katalog-toast.service';

@Component({
  selector: 'app-katalog-layout',
  standalone: true,
  imports: [RouterOutlet, KatalogBottomNavComponent, KatalogHeaderComponent],
  templateUrl: './katalog-layout.component.html'
})
export class KatalogLayoutComponent {
  toastService = inject(KatalogToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  showHeader = signal(true);
  showBottomNav = signal(true);

  constructor() {
    this.router.events.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      const url = this.router.url.split('?')[0];
      const allowedPaths = ['/katalog/cart', '/katalog/checkout', '/katalog/search'];
      this.showHeader.set(allowedPaths.includes(url) || url.startsWith('/katalog/product/'));
      
      // Show Bottom Nav only on catalog home page ('/katalog')
      this.showBottomNav.set(url === '/katalog');
    });
  }
}
