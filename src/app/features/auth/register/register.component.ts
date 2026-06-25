import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

  fullNameControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);

  registerForm = new FormGroup({
    fullName: this.fullNameControl,
    phone: this.phoneControl,
    email: this.emailControl,
    password: this.passwordControl
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    const fullName = this.fullNameControl.value || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const success = await this.authStore.register({
      id: '',
      firstName: firstName,
      lastName: lastName,
      phone: this.phoneControl.value || '',
      email: this.emailControl.value || '',
      password: this.passwordControl.value || '',
      avatar: ''
    });
    this.isLoading.set(false);

    if (success) {
      this.router.navigate(['/auth/login']);
    }
  }
}
