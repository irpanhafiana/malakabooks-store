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
  template: `
    <div>
      <h2 class="text-xl font-display font-extrabold text-slate-800 tracking-tight text-center mb-1">Daftar Akun Baru</h2>
      <p class="text-slate-500 text-xs text-center mb-6">Sudah memiliki akun? <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Sign in</a></p>

      <form [formGroup]="registerForm" (submit)="onSubmit()" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nama Depan"
            type="text"
            placeholder="e.g. John"
            icon="user"
            [control]="firstNameControl"
          ></app-input>
          
          <app-input
            label="Nama Belakang"
            type="text"
            placeholder="e.g. Doe"
            icon="user"
            [control]="lastNameControl"
          ></app-input>
        </div>

        <app-input
          label="Nomor Telepon"
          type="tel"
          placeholder="e.g. 08123456789"
          icon="phone"
          [control]="phoneControl"
        ></app-input>

        <app-input
          label="Email"
          type="email"
          placeholder="e.g. email@example.com"
          icon="envelope"
          [control]="emailControl"
        ></app-input>

        <app-input
          label="Password"
          type="password"
          placeholder="Min. 6 karakter"
          icon="lock"
          [control]="passwordControl"
        ></app-input>

        <div class="flex flex-col gap-1">
          <app-input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            icon="lock"
            [control]="confirmPasswordControl"
          ></app-input>
          @if (registerForm.errors?.['passwordMismatch'] && (confirmPasswordControl.dirty || confirmPasswordControl.touched)) {
            <span class="text-rose-500 text-xs mt-1.5 block animate-fade-in">Sandi konfirmasi harus cocok.</span>
          }
        </div>

        <div class="mt-4">
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="registerForm.invalid"
            [fullWidth]="true"
            variant="primary"
          >
            Daftar Sekarang
          </app-button>
        </div>
      </form>
    </div>
  `
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
