import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CheckoutPage } from './checkout';
import { CurrencyRupiahPipe } from '../../../shared/pipes/currency.pipe';
import { ButtonComponent } from '../../../shared/components/button/button';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-checkout-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyRupiahPipe, ButtonComponent, BadgeComponent],
  templateUrl: './checkout-desktop.html'
})
export class CheckoutDesktopComponent {
  parent = input.required<CheckoutPage>();
}
