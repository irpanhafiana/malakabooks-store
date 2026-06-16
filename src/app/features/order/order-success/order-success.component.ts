import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, ButtonComponent, SkeletonComponent],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent implements OnInit {
  protected readonly orderStore = inject(OrderStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const orderId = params['id'];
      if (orderId && (!this.orderStore.currentOrder() || this.orderStore.currentOrder()?.id !== orderId)) {
        this.orderStore.loadOrderDetails(orderId);
      }
    });
  }
}
