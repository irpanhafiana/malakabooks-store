import { describe, it, expect } from 'vitest';
import { getBffLoginUrl, getBffLogoutUrl, resolveBffLogoutUrl } from './login-url.util';
import * as envModule from '../../../environments/environment';

describe('login-url.util', () => {
  it('should build relative login URL when appUrl is empty (development)', () => {
    Object.assign(envModule.environment, {
      production: false,
      appUrl: '',
      authUrl: '/bff/login',
      apiBaseUrl: '/api/v1',
      apiUrl: '/api/v1/',
      userPasswordApiUrl: '/api/UserPassword',
      posApiUrl: 'http://localhost:10100/',
      originCode: '32.71.10.10',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/');
    expect(url).toBe('/bff/login?returnUrl=%2F&app=mardika');
  });

  it('should build proper production redirect URL matching backend requirements', () => {
    Object.assign(envModule.environment, {
      production: true,
      appUrl: 'https://mardikakopi.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/');
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com&app=mardika'
    );
  });

  it('should include target path when provided in production', () => {
    Object.assign(envModule.environment, {
      production: true,
      appUrl: 'https://mardikakopi.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/checkout');
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com%252Fcheckout&app=mardika'
    );
  });

  it('should append additional query params such as client_type', () => {
    Object.assign(envModule.environment, {
      production: true,
      appUrl: 'https://mardikakopi.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/admin', { client_type: 'admin' });
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com%252Fadmin&app=mardika&client_type=admin'
    );
  });

  it('should build identical logout URL differing only by bff/logout', () => {
    Object.assign(envModule.environment, {
      production: true,
      appUrl: 'https://mardikakopi.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const logoutUrl = getBffLogoutUrl('/');
    expect(logoutUrl).toBe(
      'https://tokosuburjaya.com:17801/bff/logout?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com'
    );
  });

  describe('resolveBffLogoutUrl', () => {
    it('should fallback to default logout URL when claim is missing', () => {
      Object.assign(envModule.environment, {
        production: true,
        appUrl: 'https://mardikakopi.com',
        authUrl: 'https://tokosuburjaya.com:17801/bff/login',
        apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
        apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
        userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
        posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
        originCode: '32.71.10.8',
        dokuScriptUrl: '',
        dokuStyleUrl: ''
      });

      expect(resolveBffLogoutUrl(null)).toBe(
        'https://tokosuburjaya.com:17801/bff/logout?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com'
      );
    });

    it('should resolve relative bff:logout_url to full BFF URL with returnUrl in production', () => {
      Object.assign(envModule.environment, {
        production: true,
        appUrl: 'https://mardikakopi.com',
        authUrl: 'https://tokosuburjaya.com:17801/bff/login',
        apiBaseUrl: 'https://tokosuburjaya.com:17801/api/v1',
        apiUrl: 'https://tokosuburjaya.com:17801/api/v1/',
        userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
        posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
        originCode: '32.71.10.8',
        dokuScriptUrl: '',
        dokuStyleUrl: ''
      });

      const url = resolveBffLogoutUrl('/bff/logout?sid=45432E9ED7F6C835C8DEFA30A4B76904', '/');
      expect(url).toBe(
        'https://tokosuburjaya.com:17801/bff/logout?sid=45432E9ED7F6C835C8DEFA30A4B76904&returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmardikakopi.com'
      );
    });

    it('should keep relative url with proper returnUrl in development', () => {
      Object.assign(envModule.environment, {
        production: false,
        appUrl: '',
        authUrl: '/bff/login',
        apiBaseUrl: '/api/v1',
        apiUrl: '/api/v1/',
        userPasswordApiUrl: '/api/UserPassword',
        posApiUrl: 'http://localhost:10100/',
        originCode: '32.71.10.10',
        dokuScriptUrl: '',
        dokuStyleUrl: ''
      });

      const url = resolveBffLogoutUrl('/bff/logout?sid=abc', '/');
      expect(url).toBe('/bff/logout?sid=abc&returnUrl=%2F');
    });
  });
});
