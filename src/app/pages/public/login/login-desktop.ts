import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginPage } from './login';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-login-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FormInputComponent],
  templateUrl: './login-desktop.html'
})
export class LoginDesktopComponent {
  parent = input.required<LoginPage>();
}
