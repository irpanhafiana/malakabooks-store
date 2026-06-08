import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div>
      <h2 class="text-xl font-display font-extrabold text-slate-800 tracking-tight text-center mb-1">Create an account</h2>
      <p class="text-slate-500 text-xs text-center mb-6">Already have an account? <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Sign in</a></p>

      <form [formGroup]="registerForm" (submit)="onSubmit()" class="flex flex-col gap-4">
        <app-input
          label="Full Name"
          type="text"
          placeholder="e.g. Dewi Lestari"
          icon="user"
          [control]="nameControl"
        ></app-input>

        <app-input
          label="Email Address"
          type="email"
          placeholder="e.g. dewi@example.com"
          icon="user"
          [control]="emailControl"
        ></app-input>

        <app-input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          icon="cog"
          [control]="passwordControl"
        ></app-input>

        <app-input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          icon="cog"
          [control]="confirmControl"
        ></app-input>

        <div class="mt-2">
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="registerForm.invalid"
            [fullWidth]="true"
            variant="primary"
          >
            Create Account
          </app-button>
        </div>
      </form>
    </div>
  `
})
export class RegisterComponent {
  private readonly authStore = inject(AuthStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

  nameControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  confirmControl = new FormControl('', [Validators.required]);

  registerForm = new FormGroup({
    name: this.nameControl,
    email: this.emailControl,
    password: this.passwordControl,
    confirmPassword: this.confirmControl
  }, {
    validators: (group) => {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordMismatch: true };
    }
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    if (this.passwordControl.value !== this.confirmControl.value) {
      this.toastService.error('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    const name = this.nameControl.value || '';
    const email = this.emailControl.value || '';

    const success = await this.authStore.register(name, email);
    this.isLoading.set(false);

    if (success) {
      this.router.navigate(['/']);
    }
  }
}
