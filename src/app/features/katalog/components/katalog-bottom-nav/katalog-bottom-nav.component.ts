import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { KatalogCartStore } from '../../../../store/katalog-cart.store';

@Component({
  selector: 'app-katalog-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './katalog-bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogBottomNavComponent {
  cartStore = inject(KatalogCartStore);
}
