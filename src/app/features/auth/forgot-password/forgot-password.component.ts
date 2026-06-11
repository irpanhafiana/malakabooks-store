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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
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
