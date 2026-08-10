import { User } from '../models';

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
