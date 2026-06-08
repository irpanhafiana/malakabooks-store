import { Injectable, inject, signal, computed } from '@angular/core';
import { User } from '../core/models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';

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

  async login(email: string, password: string): Promise<boolean> {
    try {
      const users = await this.apiService.getUsers();
      // Check for user inside seed data database
      const user = users.find(u => u.email === email.trim().toLowerCase());
      if (user && password === 'password') {
        const mockToken = `mock-jwt-token-for-${user.id}-${Date.now()}`;
        const userWithToken = { ...user, token: mockToken };
        
        // Save to active session storage
        localStorage.setItem('malakabooks_session_user', JSON.stringify(userWithToken));
        localStorage.setItem('malakabooks_session_token', mockToken);

        this.state.set({ user: userWithToken, token: mockToken });
        this.toastService.success(`Welcome back, ${user.name}!`);
        return true;
      }
      this.toastService.error('Invalid email or password. (Use "password" for credentials)');
      return false;
    } catch (err) {
      this.toastService.error('Authentication error. Please try again.');
      return false;
    }
  }

  logout() {
    localStorage.removeItem('malakabooks_session_user');
    localStorage.removeItem('malakabooks_session_token');
    this.state.set({ user: null, token: null });
    this.toastService.info('You have logged out.');
  }

  async register(name: string, email: string): Promise<boolean> {
    try {
      const users = await this.apiService.getUsers();
      const exists = users.some(u => u.email === email.trim().toLowerCase());
      if (exists) {
        this.toastService.error('An account with this email already exists.');
        return false;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'customer',
        joinedAt: new Date().toISOString(),
        addresses: []
      };

      await this.apiService.saveUser(newUser);
      return this.login(newUser.email, 'password');
    } catch (err) {
      this.toastService.error('Registration failed.');
      return false;
    }
  }

  async updateProfile(updatedUser: User): Promise<boolean> {
    try {
      const savedUser = await this.apiService.saveUser(updatedUser);
      const mockToken = this.token() || '';
      const userWithToken = { ...savedUser, token: mockToken };
      localStorage.setItem('malakabooks_session_user', JSON.stringify(userWithToken));
      this.state.update(s => ({ ...s, user: userWithToken }));
      this.toastService.success('Profile updated successfully!');
      return true;
    } catch (err) {
      this.toastService.error('Failed to update profile.');
      return false;
    }
  }
}
