import { Injectable, inject, signal, computed } from '@angular/core';
import { User } from '../core/models';
import { UserApiService } from '../core/services/user-api.service';
import { AlertService } from '../core/services/alert.service';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly userApi = inject(UserApiService);
  private readonly alertService = inject(AlertService);

  private readonly state = signal<UserState>({
    users: [],
    loading: false,
    error: null
  });

  // Selectors
  readonly users = computed(() => this.state().users);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  async loadUsers() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    try {
      const users = await this.userApi.getUsers();
      this.state.update(s => ({ ...s, users, loading: false }));
    } catch {
      this.state.update(s => ({ ...s, loading: false, error: 'Gagal memuat daftar pengguna.' }));
      this.alertService.error('Gagal memuat daftar pengguna.');
    }
  }

  async saveUser(user: Partial<User>) {
    this.state.update(s => ({ ...s, loading: true }));
    try {
      await this.userApi.saveUser(user as User);
      await this.loadUsers();
    } catch (e) {
      this.state.update(s => ({ ...s, loading: false }));
      throw e;
    }
  }
}
