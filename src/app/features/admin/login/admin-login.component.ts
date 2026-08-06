import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../store/auth.store';
import { AdminInputComponent } from '../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../shared/ui/admin-button/admin-button.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent],
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);

  isLoading = signal<boolean>(false);
  sessionMessage = signal<string>('');

  clearSessionMessage() {
    this.sessionMessage.set('');
  }

  ngOnInit() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session_expired') {
      this.sessionMessage.set('Sesi admin Anda telah berakhir. Silakan masuk kembali.');
    } else if (reason === 'unauthorized') {
      this.sessionMessage.set('Anda tidak memiliki akses admin. Silakan masuk kembali.');
    }
  }

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);

  loginForm = new FormGroup({
    username: this.usernameControl,
    password: this.passwordControl
  });

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
        this.alertService.error('Akses ditolak: Anda bukan seorang administrator.');
        this.authStore.logout();
      }
    }
  }
}
