import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginPage } from './login';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-login-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FormInputComponent],
  templateUrl: './login-mobile.html'
})
export class LoginMobileComponent {
  parent = input.required<LoginPage>();
}
