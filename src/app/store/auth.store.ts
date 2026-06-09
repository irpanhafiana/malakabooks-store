import { Injectable, inject, signal, computed } from '@angular/core';
import { User } from '../core/models';
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

        const user = await this.apiService.getUserById(userId);
        if (!user) {
          this.toastService.error('Profil user gagal dimuat dari server.');
          return false;
        }

        const userWithToken = { ...user, token };

        // Simpan sesi aktif ke localStorage
        localStorage.setItem('malakabooks_session_user', JSON.stringify(userWithToken));
        localStorage.setItem('malakabooks_session_token', token);

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

  async register(name: string, email: string): Promise<boolean> {
    this.toastService.warning('Pendaftaran akun baru harus melalui Identity Server portal. Silakan hubungi admin atau gunakan akun terdaftar (e.g. customer@malakabooks.local).');
    return false;
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
