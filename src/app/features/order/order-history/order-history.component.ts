import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../../../store/auth.store';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ExternalMessageService } from '../../../core/services/external-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, EmptyStateComponent, SkeletonComponent, StatusBadgeComponent, DatePipe, ButtonComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly externalMessageService = inject(ExternalMessageService);

  ngOnInit() {
    const user = this.authStore.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.orderStore.loadUserOrders(user.id);
  }

  checkPaymentStatus(orderId: string) {
    this.externalMessageService.postCheckPaymentDoku(orderId).subscribe({
      next: (response) => {
        console.log('Status Pembayaran DOKU:', response);
        const user = this.authStore.currentUser();
        if (user) {
          this.orderStore.loadUserOrders(user.id);
        }
      },
      error: (err) => {
        console.error('Gagal mengecek status pembayaran DOKU', err);
      }
    });
  }
}
