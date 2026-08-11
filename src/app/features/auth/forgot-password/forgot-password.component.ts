import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly authStore = inject(AuthStore);

  isLoading = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);

  emailControl = new FormControl('', [Validators.required, Validators.email]);

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.emailControl.invalid || !this.emailControl.value) return;

    this.isLoading.set(true);
    const success = await this.authStore.forgotPassword(this.emailControl.value);
    this.isLoading.set(false);
    
    if (success) {
      this.isSubmitted.set(true);
    }
  }
}
