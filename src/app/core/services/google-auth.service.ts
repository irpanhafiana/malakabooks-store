import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { decodeJwt } from '../auth/jwt.util';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';
import { AuthStore } from '../../store/auth.store';
import { User } from '../models';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly authStore = inject(AuthStore);
  private readonly ngZone = inject(NgZone);

  private readonly clientId = '785241388758-rv7vrb7fu9c011k34ulbcu5sq6uli1hm.apps.googleusercontent.com';
  private token: string | undefined;

  initializeGsi(callback: (response: any) => void) {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          this.ngZone.run(() => {
            callback(response);
          });
        },
        use_fedcm_for_prompt: false
      });
    }
  }

  renderButton(element: HTMLElement | null) {
    if (element && typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular'
      });
    }
  }

  promptLogin() {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.logger.error('GoogleAuthService.prompt', notification.getNotDisplayedReason());
        }
      });
    }
  }

  async handleCredentialResponse(response: any): Promise<boolean> {
    if (!response || !response.credential) return false;
    this.token = response.credential;
    const responsePayload = decodeJwt(response.credential);

    try {
      const name = responsePayload?.name || responsePayload?.given_name || responsePayload?.email || 'Google User';
      const userId = responsePayload?.sub || 'google-' + Date.now();

      const user: User = {
        id: userId,
        name: name,
        email: (responsePayload?.email as string) || '',
        role: 'customer',
        avatar: (responsePayload?.['picture'] as string) || '',
        joinedAt: new Date().toISOString(),
        addresses: []
      };

      await this.ngZone.run(async () => {
        await this.authStore.setGoogleSession(response.credential, user);
        this.toast.success(`Selamat datang, ${name}!`);
        await this.router.navigate(['/']);
      });

      return true;
    } catch (err) {
      this.logger.error('GoogleAuthService.handleCredentialResponse', err);
      this.toast.error('Gagal melakukan autentikasi dengan Google.');
      return false;
    }
  }

  signOut() {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
    this.token = undefined;
  }

  getToken(): string | undefined {
    return this.token;
  }
}
