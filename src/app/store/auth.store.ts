import { Injectable, inject, signal, computed } from '@angular/core';
import { User, RegisterPayload, Address } from '../core/models';
import { AuthApiService } from '../core/services/auth-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { ToastService } from '../core/services/toast.service';
import { LoggerService } from '../core/services/logger.service';
import { CartStore } from './cart.store';
import { decodeJwt, isTokenExpired, jwtHasAdminRole, mapJwtToUser } from '../core/auth/jwt.util';
import { SESSION_TOKEN_KEY, SESSION_USER_KEY, SESSION_REFRESH_KEY } from '../core/auth/session.util';

interface AuthState {
  user: User | null;
  token: string | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly cartStore = inject(CartStore);

  // Private state signal
  private readonly state = signal<AuthState>({
    user: null,
    token: null,
    error: null
  });

  // Selectors
  readonly currentUser = computed(() => this.state().user);
  readonly token = computed(() => this.state().token);
  readonly error = computed(() => this.state().error);
  readonly isLoggedIn = computed(() => this.state().user !== null);
  readonly isAdmin = computed(() => this.state().user?.role === 'admin');

  private _refreshToken: string | null = null;

  constructor() {
    this.loadSession();
  }

  getRefreshToken(): string | null {
    return this._refreshToken;
  }

  private loadSession() {
    if (typeof localStorage === 'undefined') return;
    const savedUser = localStorage.getItem(SESSION_USER_KEY);
    const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const savedRefresh = localStorage.getItem(SESSION_REFRESH_KEY);
    if (!savedUser || !savedToken) return;

    // If token is expired and we have no refresh token, clear session
    if (isTokenExpired(savedToken) && !savedRefresh) {
      this.clearPersistedSession();
      return;
    }

    // If token is expired but refresh token exists, store refresh token for later use
    // The interceptor will handle refresh on the next API call
    if (savedRefresh) {
      this._refreshToken = savedRefresh;
    }

    // If token is expired, still restore the user so the UI doesn't flash,
    // the interceptor will refresh before the first real API call
    try {
      const persisted = JSON.parse(savedUser) as User;
      const decoded = decodeJwt(savedToken);
      const role: User['role'] = jwtHasAdminRole(decoded) ? 'admin' : 'customer';
      this.state.set({
        user: { ...persisted, role, token: savedToken },
        token: savedToken,
        error: null
      });
    } catch {
      this.clearPersistedSession();
    }
  }

  private persistSession(token: string, userWithToken: User, refreshToken?: string) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userWithToken));
    if (refreshToken) {
      localStorage.setItem(SESSION_REFRESH_KEY, refreshToken);
      this._refreshToken = refreshToken;
    }
  }

  /** DRY helper: merge partial user data into persisted session + state signal */
  private syncUser(partial: Partial<User>) {
    const currentUser = this.state().user;
    if (!currentUser) return;
    const activeToken = this.token() ?? currentUser.token ?? '';
    const merged = { ...currentUser, ...partial, token: activeToken };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(merged));
    this.state.update(s => ({ ...s, user: merged }));
  }

  private clearPersistedSession() {
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_REFRESH_KEY);
    this._refreshToken = null;
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this._refreshToken;
    if (!refreshToken) return false;

    try {
      const result = await this.authApi.refreshToken(refreshToken);
      if (!result) return false;

      // Update the stored token
      localStorage.setItem(SESSION_TOKEN_KEY, result.accessToken);

      // Update refresh token if a new one was issued
      if (result.refreshToken) {
        localStorage.setItem(SESSION_REFRESH_KEY, result.refreshToken);
        this._refreshToken = result.refreshToken;
      }

      // Update the user object with the new token
      const currentUser = this.state().user;
      if (currentUser) {
        const userWithToken = { ...currentUser, token: result.accessToken };
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userWithToken));
        this.state.set({ user: userWithToken, token: result.accessToken, error: null });
      } else {
        this.state.update(s => ({ ...s, token: result.accessToken }));
      }

      return true;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const result = await this.authApi.loginAndGetToken(username, password);
      if (result) {
        const { accessToken, refreshToken } = result;
        const user = mapJwtToUser(decodeJwt(accessToken));
        if (!user) {
          this.toastService.error('Token tidak valid: User ID tidak ditemukan.');
          return false;
        }

        const userWithToken = { ...user, token: accessToken };
        this.persistSession(accessToken, userWithToken, refreshToken);
        this.state.set({ user: userWithToken, token: accessToken, error: null });

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
    this.clearPersistedSession();
    this.cartStore.clearOnLogout();
    this.state.set({ user: null, token: null, error: null });
    this.toastService.info('Anda telah keluar.');
  }

  async register(payload: RegisterPayload): Promise<boolean> {
    try {
      await this.userApi.register(payload);
      this.toastService.success('Pendaftaran akun berhasil! Silakan masuk.');
      return true;
    } catch (err: any) {
      this.logger.error('AuthStore.register', err);
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
      this.syncUser(savedUser);
      this.toastService.success('Profil berhasil diperbarui!');
      return true;
    } catch {
      this.toastService.error('Gagal memperbarui profil.');
      return false;
    }
  }

  async addAddress(addr: Address): Promise<boolean> {
    const user = this.state().user;
    if (!user) return false;
    try {
      const success = await this.userApi.addAddress(user.id, user.name, addr);
      if (success) {
        const updatedAddresses = await this.userApi.getAddressesByUserId(user.id);
        this.syncUser({ addresses: updatedAddresses } as Partial<User>);
        this.toastService.success('Alamat berhasil ditambahkan!');
        return true;
      }
      this.toastService.error('Gagal menambahkan alamat.');
      return false;
    } catch {
      this.toastService.error('Gagal menambahkan alamat.');
      return false;
    }
  }

  async updateAddress(addr: Address): Promise<boolean> {
    const user = this.state().user;
    if (!user) return false;
    try {
      const success = await this.userApi.updateAddress(user.id, user.name, addr);
      if (success) {
        const updatedAddresses = await this.userApi.getAddressesByUserId(user.id);
        this.syncUser({ addresses: updatedAddresses } as Partial<User>);
        this.toastService.success('Alamat berhasil diperbarui!');
        return true;
      }
      this.toastService.error('Gagal memperbarui alamat.');
      return false;
    } catch {
      this.toastService.error('Gagal memperbarui alamat.');
      return false;
    }
  }

  async deleteAddress(id: string): Promise<boolean> {
    const user = this.state().user;
    if (!user) return false;
    try {
      const success = await this.userApi.deleteAddress(id);
      if (success) {
        const updatedAddresses = await this.userApi.getAddressesByUserId(user.id);
        this.syncUser({ addresses: updatedAddresses } as Partial<User>);
        this.toastService.success('Alamat berhasil dihapus!');
        return true;
      }
      this.toastService.error('Gagal menghapus alamat.');
      return false;
    } catch {
      this.toastService.error('Gagal menghapus alamat.');
      return false;
    }
  }
}
