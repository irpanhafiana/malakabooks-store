import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderStore } from '../../../store/order.store';
import { PriceComponent } from '../../../shared/ui/price/price.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, PriceComponent, IconComponent, ButtonComponent],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent {
  protected readonly orderStore = inject(OrderStore);
}
