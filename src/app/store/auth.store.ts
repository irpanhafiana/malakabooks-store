import { Injectable, inject, signal, computed } from '@angular/core';
import { User, RegisterPayload } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { CartStore } from './cart.store';

interface AuthState {
  user: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly apiService = inject(ApiService);
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
    const savedUser = localStorage.getItem('malakabooks_session_user');
    const savedToken = localStorage.getItem('malakabooks_session_token');
    if (savedUser && savedToken) {
      this.state.set({
        user: JSON.parse(savedUser),
        token: savedToken
      });
    }
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const token = await this.apiService.loginAndGetToken(username, password);
      if (token) {
        const decoded = this.decodeToken(token);
        // IdentityServer4 sub claim menyimpan UserId
        const userId = decoded?.sub || decoded?.nameid;

        if (!userId) {
          this.toastService.error('Token tidak valid: User ID tidak ditemukan.');
          return false;
        }

        // Simpan token dulu agar interceptor bisa mengirim Bearer pada request berikutnya
        localStorage.setItem('malakabooks_session_token', token);

        const roles = decoded?.role || [];
        const hasRole = (roleName: string) => {
          if (Array.isArray(roles)) {
            return roles.some((r: string) => r.toLowerCase() === roleName.toLowerCase());
          }
          if (typeof roles === 'string') {
            return roles.toLowerCase() === roleName.toLowerCase();
          }
          return false;
        };

        const isUserAdmin = hasRole('Malaka-Admin') || hasRole('admin');

        const user: User = {
          id: userId,
          name: decoded?.given_name || decoded?.name || 'User',
          email: decoded?.email || '',
          role: isUserAdmin ? 'admin' : 'customer',
          phone: decoded?.phone_number || decoded?.phone || (decoded?.name && !decoded?.name.includes('@') ? decoded.name : ''),
          avatar: decoded?.avatar || '',
          joinedAt: decoded?.joined_at || new Date().toISOString(),
          addresses: []
        };

        const userWithToken = { ...user, token };
        localStorage.setItem('malakabooks_session_user', JSON.stringify(userWithToken));

        this.state.set({ user: userWithToken, token });

        // Sync cart guest ke backend
        const products = await this.apiService.getProducts();
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
    localStorage.removeItem('malakabooks_session_user');
    localStorage.removeItem('malakabooks_session_token');
    this.cartStore.clearOnLogout();
    this.state.set({ user: null, token: null });
    this.toastService.info('Anda telah keluar.');
  }

  async register(payload: RegisterPayload): Promise<boolean> {
    try {
      await this.apiService.register(payload);
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
      const savedUser = await this.apiService.saveUser(updatedUser);
      const activeToken = this.token() || '';
      const userWithToken = { ...savedUser, token: activeToken };
      localStorage.setItem('malakabooks_session_user', JSON.stringify(userWithToken));
      this.state.update(s => ({ ...s, user: userWithToken }));
      this.toastService.success('Profil berhasil diperbarui!');
      return true;
    } catch (err) {
      this.toastService.error('Gagal memperbarui profil.');
      return false;
    }
  }
}
