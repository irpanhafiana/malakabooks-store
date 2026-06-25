import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../store/auth.store';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CheckboxComponent } from '../../../shared/ui/checkbox/checkbox.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent, CheckboxComponent],

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isProduction = environment.production;

  isLoading = signal<boolean>(false);
  sessionMessage = signal<string>('');

  ngOnInit() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionMessage.set('Sesi Anda telah berakhir. Silakan masuk kembali.');
    } else if (reason === 'unauthorized') {
      this.sessionMessage.set('Anda tidak memiliki akses. Silakan masuk kembali.');
    }
  }

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  rememberMeControl = new FormControl(false);

  loginForm = new FormGroup({
    username: this.usernameControl,
    password: this.passwordControl,
    rememberMe: this.rememberMeControl
  });

  fillDemoCredentials() {
    this.usernameControl.setValue('customer@malakabooks.local');
    this.passwordControl.setValue('ChangeMe123!');
    this.usernameControl.markAsDirty();
    this.passwordControl.markAsDirty();
    this.usernameControl.markAsTouched();
    this.passwordControl.markAsTouched();
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const username = this.usernameControl.value || '';
    const password = this.passwordControl.value || '';

    const success = await this.authStore.login(username, password);
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
