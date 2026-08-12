import { signal } from '@angular/core';
import { User } from '../models';

export const SESSION_CART_KEY = 'malakabooks_cart';

type StoredUser = (User & { token?: string }) | null;

/**
 * Sumber kebenaran sesi untuk kode non-injectable.
 *
 * Sengaja berupa signal level-modul, bukan service ber-DI: `AuthStore` sudah
 * meng-inject `ProductApiService`, sehingga service API yang balik meng-inject
 * `AuthStore` akan membentuk circular dependency. Ditulis hanya oleh `AuthStore`.
 */
const sessionUser = signal<StoredUser>(null);

export function setSessionUser(user: StoredUser): void {
  sessionUser.set(user);
}

export function clearSessionUser(): void {
  sessionUser.set(null);
}

export function getStoredSessionUser(): StoredUser {
  return sessionUser();
}

export function isAdminSession(): boolean {
  return sessionUser()?.role === 'admin';
}

export function isCustomerSession(): boolean {
  const user = sessionUser();
  return user !== null && user.role !== 'admin';
}

export function getSessionUserId(): string | null {
  return sessionUser()?.id ?? null;
}
