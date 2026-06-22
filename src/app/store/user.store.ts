import { Injectable, signal, computed } from '@angular/core';

interface UserState {
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly state = signal<UserState>({
    loading: false
  });

  // Selectors
  readonly loading = computed(() => this.state().loading);

  constructor() {}
}
