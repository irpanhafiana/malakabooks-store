import { Injectable, inject, signal, computed } from '@angular/core';
import { User, RegisterPayload, Address } from '../core/models';
import { AuthApiService } from '../core/services/auth-api.service';
import { UserApiService } from '../core/services/user-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { AlertService } from '../core/services/alert.service';
import { LoggerService } from '../core/services/logger.service';
import { CartStore } from './cart.store';
import { BffClaim, mapClaimsToUser, readLogoutUrl } from '../core/auth/bff-claims.util';
import { setSessionUser, clearSessionUser } from '../core/auth/session.util';

interface AuthState {
  user: User | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly alertService = inject(AlertService);
  private readonly logger = inject(LoggerService);
  private readonly cartStore = inject(CartStore);

  // Private state signal.
  // Tidak ada access token di sini: dengan pola BFF, token disimpan BFF di sisi
  // server dan disisipkan sendiri saat mem-proxy panggilan API.
  private readonly state = signal<AuthState>({
    user: null,
    error: null
  });

  /** URL logout dari klaim `bff:logout_url`; membawa `sid` yang diwajibkan BFF. */
  private logoutUrl: string | null = null;

  private sessionPromise: Promise<boolean> | null = null;
  private revalidatePromise: Promise<BffClaim[] | null> | null = null;

  // Selectors
  readonly currentUser = computed(() => this.state().user);
  readonly error = computed(() => this.state().error);
  readonly isLoggedIn = computed(() => this.state().user !== null);
  readonly isAdmin = computed(() => this.state().user?.role === 'admin');

  private syncUser(partial: Partial<User>) {
    const currentUser = this.state().user;
    if (!currentUser) return;
    const merged = { ...currentUser, ...partial };
    this.state.update(s => ({ ...s, user: merged }));
    setSessionUser(merged);
  }

  private clearSessionState() {
    this.state.set({ user: null, error: null });
    this.logoutUrl = null;
    clearSessionUser();
  }

  /**
   * Baca sesi dari BFF. Dipanggil saat bootstrap dan setiap kali API menjawab
   * 401. Panggilan bersamaan berbagi satu request agar `/bff/user` tidak
   * ditembak berkali-kali.
   */
  initializeSession(): Promise<boolean> {
    this.sessionPromise ??= this.loadSession().finally(() => {
      this.sessionPromise = null;
    });
    return this.sessionPromise;
  }

  private async loadSession(): Promise<boolean> {
    try {
      const claims = await this.authApi.getUser();
      console.log('[BFF Auth] Klaim mentah /bff/user:', claims);
      const user = mapClaimsToUser(claims);
      console.log('[BFF Auth] Data User terpetakan:', user);

      if (!user) {
        this.clearSessionState();
        return false;
      }

      this.logoutUrl = readLogoutUrl(claims);
      this.state.set({ user, error: null });
      // Wajib sebelum getProducts(): ProductApiService memilih endpoint
      // public/customer/admin lewat isAdminSession()/isCustomerSession().
      setSessionUser(user);

      if (user.role !== 'admin') {
        const products = await this.productApi.getProducts();
        await this.cartStore.syncOnLogin(user.id, products);
      }
      return true;
    } catch (err) {
      this.logger.error('AuthStore.initializeSession', err);
      this.clearSessionState();
      return false;
    }
  }

  /**
   * Dipanggil `authInterceptor` saat API menjawab 401. Diperiksa ulang ke BFF
   * dulu, karena 401 bisa juga berasal dari otorisasi per-endpoint (role
   * kurang), bukan dari sesi yang hilang — dan dalam kasus itu user tidak boleh
   * ikut dikeluarkan.
   */
  async handleUnauthorized(): Promise<void> {
    if (!this.isLoggedIn()) return;

    // Sengaja TIDAK memakai initializeSession(): itu ikut memuat ulang produk
    // dan menyinkronkan keranjang. Bila banyak endpoint menjawab 401 sekaligus,
    // efeknya badai request. Di sini cukup pastikan sesinya masih ada.
    this.revalidatePromise ??= this.authApi.getUser().finally(() => {
      this.revalidatePromise = null;
    });
    const claims = await this.revalidatePromise;
    if (claims) return;

    this.clearSessionState();
    this.cartStore.clearOnLogout();
  }

  async logout() {
    const returnUrl = encodeURIComponent(window.location.origin + '/');
    let targetUrl = this.logoutUrl ?? `${this.authApi.bffUrl('logout')}`;
    if (!targetUrl.includes('returnUrl=')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}returnUrl=${returnUrl}`;
    }

    let redirectUrl: string | null = null;
    try {
      redirectUrl = await this.authApi.logout(targetUrl);
    } catch (e) {
      this.logger.error('AuthStore.logout', e);
    } finally {
      this.clearSessionState();
      this.cartStore.clearOnLogout();
      this.alertService.info('Anda telah keluar.');
      window.location.href = redirectUrl || targetUrl;
    }
  }

  async register(payload: RegisterPayload): Promise<boolean> {
    try {
      await this.userApi.register(payload);
      this.alertService.success('Pendaftaran akun berhasil! Silakan masuk.');
      return true;
    } catch (err) {
      this.logger.error('AuthStore.register', err);
      return false;
    }
  }

  async forgotPassword(email: string, callbackUrl = 'string'): Promise<boolean> {
    const success = await this.authApi.forgotPassword(email, callbackUrl);
    if (success) {
      this.alertService.success('Tautan pemulihan kata sandi berhasil dikirim.');
    } else {
      this.alertService.error('Gagal mengirim tautan pemulihan kata sandi. Silakan coba lagi.');
    }
    return success;
  }

  async changePassword(password: string, confirmPassword: string): Promise<boolean> {
    const user = this.state().user;
    if (!user?.id) {
      this.alertService.error('Pengguna tidak terautentikasi.');
      return false;
    }
    const success = await this.userApi.changePassword(user.id, password, confirmPassword);
    if (success) {
      this.alertService.success('Kata sandi berhasil diperbarui!');
    } else {
      this.alertService.error('Gagal memperbarui kata sandi. Silakan coba lagi.');
    }
    return success;
  }

  async updateProfile(updatedUser: User, avatarFile?: File): Promise<boolean> {
    try {
      const savedUser = await this.userApi.saveUser(updatedUser, avatarFile);
      this.syncUser(savedUser);
      this.alertService.success('Profil berhasil diperbarui!');
      return true;
    } catch {
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
        this.alertService.success('Alamat berhasil ditambahkan!');
        return true;
      }
      return false;
    } catch {
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
        this.alertService.success('Alamat berhasil diperbarui!');
        return true;
      }
      return false;
    } catch {
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
        this.alertService.success('Alamat berhasil dihapus!');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
