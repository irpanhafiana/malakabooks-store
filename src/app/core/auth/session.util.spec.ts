import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../models';
import {
  setSessionUser,
  clearSessionUser,
  getStoredSessionUser,
  getSessionUserId,
  isAdminSession,
  isCustomerSession
} from './session.util';

const makeUser = (role: 'admin' | 'customer'): User => ({
  id: 'user-1',
  name: 'Budi',
  email: 'budi@example.com',
  role,
  phone: '',
  avatar: '',
  joinedAt: new Date().toISOString(),
  addresses: []
});

describe('session.util', () => {
  beforeEach(() => {
    clearSessionUser();
    localStorage.clear();
  });

  it('reports no session before AuthStore populates it', () => {
    expect(getStoredSessionUser()).toBeNull();
    expect(isAdminSession()).toBe(false);
    expect(isCustomerSession()).toBe(false);
    expect(getSessionUserId()).toBeNull();
  });

  it('recognises a customer session once set', () => {
    setSessionUser(makeUser('customer'));

    expect(isCustomerSession()).toBe(true);
    expect(isAdminSession()).toBe(false);
    expect(getSessionUserId()).toBe('user-1');
  });

  it('recognises an admin session once set', () => {
    setSessionUser(makeUser('admin'));

    expect(isAdminSession()).toBe(true);
    expect(isCustomerSession()).toBe(false);
  });

  it('drops the session on clear', () => {
    setSessionUser(makeUser('customer'));
    clearSessionUser();

    expect(getStoredSessionUser()).toBeNull();
    expect(isCustomerSession()).toBe(false);
  });

  it('does not read from localStorage', () => {
    // Regresi: sesi dulu dibaca dari localStorage. Sejak pola BFF, token dan
    // user tidak boleh lagi bersumber dari sana.
    localStorage.setItem('malakabooks_session_user', JSON.stringify(makeUser('admin')));

    expect(getStoredSessionUser()).toBeNull();
    expect(isAdminSession()).toBe(false);
  });
});
