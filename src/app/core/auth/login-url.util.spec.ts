import { describe, it, expect, vi } from 'vitest';
import { getBffLoginUrl, getBffLogoutUrl, resolveBffLogoutUrl } from './login-url.util';
import * as envModule from '../../../environments/environment';

describe('login-url.util', () => {
  it('should build relative login URL when appUrl is empty (development)', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
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
    expect(url).toBe('/bff/login?returnUrl=%2F');
  });

  it('should build proper production redirect URL matching backend requirements', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://malakabooks.com',
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
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com'
    );
  });

  it('should include target path when provided in production', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://malakabooks.com',
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
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com%252Fcheckout'
    );
  });

  it('should append additional query params such as client_type', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://malakabooks.com',
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
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com%252Fadmin&client_type=admin'
    );
  });

  it('should build identical logout URL differing only by bff/logout', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://malakabooks.com',
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
      'https://tokosuburjaya.com:17801/bff/logout?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com'
    );
  });

  describe('resolveBffLogoutUrl', () => {
    it('should fallback to default logout URL when claim is missing', () => {
      vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
        production: true,
        appUrl: 'https://malakabooks.com',
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
        'https://tokosuburjaya.com:17801/bff/logout?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com'
      );
    });

    it('should resolve relative bff:logout_url to full BFF URL with returnUrl in production', () => {
      vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
        production: true,
        appUrl: 'https://malakabooks.com',
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
        'https://tokosuburjaya.com:17801/bff/logout?sid=45432E9ED7F6C835C8DEFA30A4B76904&returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%253A%252F%252Fmalakabooks.com'
      );
    });

    it('should keep relative url with proper returnUrl in development', () => {
      vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
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
