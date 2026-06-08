import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div>
      <h2 class="text-xl font-display font-extrabold text-slate-800 tracking-tight text-center mb-1">Sign in to your account</h2>
      <p class="text-slate-500 text-xs text-center mb-6">Or <a routerLink="/auth/register" class="text-primary-600 hover:text-primary-700 font-semibold transition-colors">create a new account</a></p>

      <form [formGroup]="loginForm" (submit)="onSubmit()" class="flex flex-col gap-4">
        <app-input
          label="Email Address"
          type="email"
          placeholder="e.g. customer@example.com"
          icon="user"
          [control]="emailControl"
        ></app-input>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label for="password" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
            <a routerLink="/auth/forgot-password" class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 transition-colors">Forgot password?</a>
          </div>
          <app-input
            type="password"
            placeholder="e.g. password"
            icon="cog"
            [control]="passwordControl"
          ></app-input>
        </div>

        <div class="mt-2">
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="loginForm.invalid"
            [fullWidth]="true"
            variant="primary"
          >
            Sign In
          </app-button>
        </div>
      </form>

      <div class="mt-6 border-t border-slate-100 pt-4 text-center">
        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demo Credentials:</span>
        <div class="flex flex-col gap-1 mt-2 text-[10px] text-slate-500 font-medium">
          <p>Customer: <code class="bg-slate-50 px-1.5 py-0.5 rounded text-primary-600">customer&#64;example.com</code> / password</p>
          <p>Admin: <code class="bg-slate-50 px-1.5 py-0.5 rounded text-primary-600">admin&#64;example.com</code> / password</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);

  loginForm = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const email = this.emailControl.value || '';
    const password = this.passwordControl.value || '';

    const success = await this.authStore.login(email, password);
    this.isLoading.set(false);

    if (success) {
      if (this.authStore.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
