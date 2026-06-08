import { Component, inject, signal } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div>
      <h2 class="text-xl font-display font-extrabold text-slate-800 tracking-tight text-center mb-1">Reset your password</h2>
      <p class="text-slate-500 text-xs text-center mb-6">Enter your email address and we'll simulate sending you a password recovery link.</p>

      @if (isSubmitted()) {
        <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs mb-6 leading-relaxed">
          <strong class="font-semibold block mb-1">Email Dispatched!</strong>
          If an account exists for <strong class="font-bold text-emerald-950">{{ emailControl.value }}</strong>, a reset code was sent. Please check your inbox.
        </div>
      }

      <form (submit)="onSubmit($event)" class="flex flex-col gap-4">
        <app-input
          label="Email Address"
          type="email"
          placeholder="e.g. customer@example.com"
          icon="user"
          [control]="emailControl"
        ></app-input>

        <div class="mt-2">
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="emailControl.invalid"
            [fullWidth]="true"
            variant="primary"
          >
            {{ isSubmitted() ? 'Resend Reset Link' : 'Send Reset Link' }}
          </app-button>
        </div>
      </form>

      <div class="mt-6 border-t border-slate-100 pt-4 text-center">
        <a routerLink="/auth/login" class="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">Back to Sign In</a>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private readonly toastService = inject(ToastService);

  isLoading = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);

  emailControl = new FormControl('', [Validators.required, Validators.email]);

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.emailControl.invalid) return;

    this.isLoading.set(true);
    
    // Simulate network delay
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSubmitted.set(true);
      this.toastService.success('Simulated password reset link sent.');
    }, 800);
  }
}
