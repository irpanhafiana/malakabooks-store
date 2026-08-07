import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { PosAuthService } from '../../../../core/services/pos-auth.service';
import { AdminInputComponent } from '../../../../shared/ui/admin-input/admin-input.component';
import { AdminButtonComponent } from '../../../../shared/ui/admin-button/admin-button.component';

/**
 * Login kasir ke gateway POS (SAP).
 *
 * Terpisah dari admin-login: kredensialnya adalah akun POS Toko Subur Jaya,
 * bukan akun administrator MalakaBooks. Admin tetap harus sudah login
 * (route ini berada di bawah adminGuard).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pos-login',
  standalone: true,
  imports: [ReactiveFormsModule, AdminInputComponent, AdminButtonComponent],
  templateUrl: './pos-login.component.html'
})
export class PosLoginComponent implements OnInit {
  private readonly posAuth = inject(PosAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  sessionMessage = signal<string>('');

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required]);

  loginForm = new FormGroup({
    username: this.usernameControl,
    password: this.passwordControl
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'unauthorized') {
      this.sessionMessage.set('Sesi kasir Anda telah berakhir. Silakan masuk kembali.');
    }
  }

  clearSessionMessage() {
    this.sessionMessage.set('');
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.sessionMessage.set('');

    this.posAuth.login(this.usernameControl.value || '', this.passwordControl.value || '').subscribe({
      next: () => {
        this.isLoading.set(false);
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.router.navigateByUrl(redirect || '/admin/pos/transaction');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.sessionMessage.set(
          err?.error?.error_description || 'Nama pengguna atau kata sandi POS salah.'
        );
      }
    });
  }
}
