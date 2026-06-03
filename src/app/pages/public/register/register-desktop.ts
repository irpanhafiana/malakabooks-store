import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterPage } from './register';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-register-desktop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FormInputComponent],
  templateUrl: './register-desktop.html'
})
export class RegisterDesktopComponent {
  parent = input.required<RegisterPage>();
}
