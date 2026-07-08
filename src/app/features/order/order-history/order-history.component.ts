import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../../../store/auth.store';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ExternalMessageService } from '../../../core/services/external-message.service';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, EmptyStateComponent, SkeletonComponent, StatusBadgeComponent, DatePipe, DecimalPipe, ButtonComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly router = inject(Router);
  private readonly externalMessageService = inject(ExternalMessageService);
  private readonly logger = inject(LoggerService);

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
        this.logger.log('Status Pembayaran DOKU:', response);
        const user = this.authStore.currentUser();
        if (user) {
          this.orderStore.loadUserOrders(user.id);
        }
      },
      error: (err) => {
        this.logger.error('Gagal mengecek status pembayaran DOKU', err);
      }
    });
  }
}
