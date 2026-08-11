import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offline-banner',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (!networkStatus.isOnline()) {
      <div class="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-down">
        <app-icon name="wifi-off" size="16"></app-icon>
        <span>Koneksi internet terputus. Anda sedang dalam mode offline.</span>
      </div>
    }
  `
})
export class OfflineBannerComponent {
  protected readonly networkStatus = inject(NetworkStatusService);
}
