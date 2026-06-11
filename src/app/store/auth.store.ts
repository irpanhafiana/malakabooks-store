import { Injectable, inject, signal, computed } from '@angular/core';
import { User, RegisterPayload } from '../core/models';
import { AuthApiService } from '../core/services/auth-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { ToastService } from '../core/services/toast.service';
import { CartStore } from './cart.store';
import { decodeJwt, isTokenExpired, jwtHasAdminRole, mapJwtToUser } from '../core/auth/jwt.util';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from '../core/auth/session.util';

interface AuthState {
  user: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly toastService = inject(ToastService);
  private readonly cartStore = inject(CartStore);

  // Private state signal
  private readonly state = signal<AuthState>({
    user: null,
    token: null
  });

  // Selectors
  readonly currentUser = computed(() => this.state().user);
  readonly token = computed(() => this.state().token);
  readonly isLoggedIn = computed(() => this.state().user !== null);
  readonly isAdmin = computed(() => this.state().user?.role === 'admin');

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const savedUser = localStorage.getItem(SESSION_USER_KEY);
    const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!savedUser || !savedToken) return;

    // Reject restored sessions whose token is missing/expired so the UI never
    // renders authenticated (or admin) state behind a dead token.
    if (isTokenExpired(savedToken)) {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return;
    }

    try {
      const persisted = JSON.parse(savedUser) as User;
      // Re-derive the role from the token rather than trusting the persisted
      // JSON blob (which a user could edit in localStorage). The token claim is
      // the authority for what the UI may render; the backend stays the real
      // security boundary.
      const decoded = decodeJwt(savedToken);
      const role: User['role'] = jwtHasAdminRole(decoded) ? 'admin' : 'customer';
      this.state.set({
        user: { ...persisted, role, token: savedToken },
        token: savedToken
      });
    } catch {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const token = await this.authApi.loginAndGetToken(username, password);
      if (token) {
        // IdentityServer4 sub claim stores the UserId; mapJwtToUser returns null
        // when the token lacks a usable id.
        const user = mapJwtToUser(decodeJwt(token));
        if (!user) {
          this.toastService.error('Token tidak valid: User ID tidak ditemukan.');
          return false;
        }

        // Persist the token first so the interceptor can attach the Bearer
        // header to the subsequent requests below.
        localStorage.setItem(SESSION_TOKEN_KEY, token);

        const userWithToken = { ...user, token };
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userWithToken));

        this.state.set({ user: userWithToken, token });

        // Sync cart guest ke backend
        const products = await this.productApi.getProducts();
        await this.cartStore.syncOnLogin(user.id, products);

        this.toastService.success(`Selamat datang kembali, ${user.name}!`);
        return true;
      }
      this.toastService.error('Email atau password salah.');
      return false;
    } catch (err) {
      this.toastService.error('Terjadi kesalahan autentikasi. Silakan coba lagi.');
      return false;
    }
  }

  logout() {
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    this.cartStore.clearOnLogout();
    this.state.set({ user: null, token: null });
    this.toastService.info('Anda telah keluar.');
  }

  async register(payload: RegisterPayload): Promise<boolean> {
    try {
      await this.userApi.register(payload);
      this.toastService.success('Pendaftaran akun berhasil! Silakan masuk.');
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorResponse = err?.error;
      if (errorResponse && errorResponse.errors) {
        const validationErrors = Object.values(errorResponse.errors).join('\n');
        this.toastService.error(validationErrors || errorResponse.statusMessage || 'Pendaftaran gagal.');
      } else {
        this.toastService.error(errorResponse?.statusMessage || 'Terjadi kesalahan koneksi server.');
      }
      return false;
    }
  }

  async updateProfile(updatedUser: User): Promise<boolean> {
    try {
      const savedUser = await this.userApi.saveUser(updatedUser);
      const activeToken = this.token() || '';
      const userWithToken = { ...savedUser, token: activeToken };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userWithToken));
      this.state.update(s => ({ ...s, user: userWithToken }));
      this.toastService.success('Profil berhasil diperbarui!');
      return true;
    } catch (err) {
      this.toastService.error('Gagal memperbarui profil.');
      return false;
    }
  }
}
