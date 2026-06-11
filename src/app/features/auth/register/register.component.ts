import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

function passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
  const group = control as FormGroup;
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

  firstNameControl = new FormControl('', [Validators.required]);
  lastNameControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl('', [Validators.required]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  confirmPasswordControl = new FormControl('', [Validators.required]);

  registerForm = new FormGroup(
    {
      firstName: this.firstNameControl,
      lastName: this.lastNameControl,
      phone: this.phoneControl,
      email: this.emailControl,
      password: this.passwordControl,
      confirmPassword: this.confirmPasswordControl
    },
    { validators: passwordMatchValidator }
  );

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    const success = await this.authStore.register({
      id: '',
      firstName: this.firstNameControl.value || '',
      lastName: this.lastNameControl.value || '',
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
