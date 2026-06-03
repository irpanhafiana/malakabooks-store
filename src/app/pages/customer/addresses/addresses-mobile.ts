import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressesPage } from './addresses';
import { ButtonComponent } from '../../../shared/components/button/button';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-addresses-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent, FormInputComponent],
  templateUrl: './addresses-mobile.html'
})
export class AddressesMobileComponent {
  parent = input.required<AddressesPage>();
}
