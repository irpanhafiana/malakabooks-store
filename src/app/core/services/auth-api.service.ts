import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly AUTH_URL = environment.authUrl;

  async loginAndGetToken(username: string, password: string): Promise<string | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'MalakaBooks-FE');
    body.set('username', username);
    body.set('password', password);
    body.set('scope', 'Create Update Delete Read offline_access MalakaBooks_Scope General_Scope');

    try {
      const res = await firstValueFrom(
        this.http.post<any>(this.AUTH_URL, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      return res.access_token || null;
    } catch (e) {
      console.error('Request token gagal:', e);
      return null;
    }
  }

  normalizeRole(role: unknown): 'admin' | 'customer' {
    const r = typeof role === 'string' ? role.toLowerCase() : '';
    return r === 'malaka-admin' || r === 'admin' ? 'admin' : 'customer';
  }
}
