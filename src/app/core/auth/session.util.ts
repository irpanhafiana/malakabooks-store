import { User } from '../models';

/**
 * Single source of truth for reading the persisted session out of localStorage.
 *
 * Previously the role/admin check was re-implemented inline at ~6 call sites in
 * ApiService (each doing its own `JSON.parse(localStorage...)`). Centralising it
 * here removes that duplication and decouples callers from the storage shape.
 *
 * NOTE: this is a frontend convenience only — it determines which endpoints the
 * UI calls. It is NOT a security boundary; the backend remains authoritative.
 */

export const SESSION_USER_KEY = 'malakabooks_session_user';
export const SESSION_TOKEN_KEY = 'malakabooks_session_token';
export const SESSION_REFRESH_KEY = 'malakabooks_session_refresh';
export const SESSION_CART_KEY = 'malakabooks_cart';

type StoredUser = (User & { token?: string }) | null;

export function getStoredSessionUser(): StoredUser {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAdminSession(): boolean {
  return getStoredSessionUser()?.role === 'admin';
}

export function isCustomerSession(): boolean {
  const user = getStoredSessionUser();
  return user !== null && user.role !== 'admin';
}

export function getSessionUserId(): string | null {
  return getStoredSessionUser()?.id ?? null;
}
