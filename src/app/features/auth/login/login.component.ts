import { Component, inject, signal, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../store/auth.store';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly authStore = inject(AuthStore);
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

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

    this.googleAuthService.initializeGsi((response: unknown) => {
      this.googleAuthService.handleCredentialResponse(response);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const googleBtn = document.getElementById('google-button');
      if (googleBtn) {
        this.googleAuthService.renderButton(googleBtn);
      }
    }, 100);
  }

  loginWithGoogle() {
    this.googleAuthService.promptLogin();
  }

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);

  loginForm = new FormGroup({
    username: this.usernameControl,
    password: this.passwordControl
  });

  fillDemoCredentials() {
    this.usernameControl.setValue('customer@ssonlineshop.local');
    this.passwordControl.setValue('ChangeMe123!');
    this.usernameControl.markAsDirty();
    this.passwordControl.markAsDirty();
    this.usernameControl.markAsTouched();
    this.passwordControl.markAsTouched();
  }

  goBack() {
    const state = this.location.getState() as { navigationId?: number };
    if (state && state.navigationId && state.navigationId > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const username = this.usernameControl.value || '';
    const password = this.passwordControl.value || '';

    const success = await this.authStore.login(username, password);
    this.isLoading.set(false);

    if (success) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      if (this.authStore.isAdmin()) {
        this.router.navigate(['/admin']);
      } else if (returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
