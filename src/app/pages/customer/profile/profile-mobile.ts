import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfilePage } from './profile';
import { FormInputComponent } from '../../../shared/components/form-input/form-input';

@Component({
  selector: 'app-profile-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, FormInputComponent],
  templateUrl: './profile-mobile.html'
})
export class ProfileMobileComponent {
  parent = input.required<ProfilePage>();
}
