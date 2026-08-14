import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBffLoginUrl } from './login-url.util';
import * as envModule from '../../../environments/environment';

describe('login-url.util', () => {
  it('should build relative login URL when appUrl is empty (development)', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: false,
      appUrl: '',
      authUrl: '/bff/login',
      apiBaseUrl: '/ssonline/api/v1',
      apiUrl: '/ssonline/api/v1/',
      userPasswordApiUrl: '/api/UserPassword',
      posApiUrl: 'http://localhost:10100/',
      originCode: '32.71.10.10',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/');
    expect(url).toBe('/bff/login?returnUrl=%2F&app=ssonline');
  });

  it('should build proper production redirect URL matching backend requirements', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://tokossonlineshop.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/');
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%3A%2F%2Ftokossonlineshop.com&app=ssonline'
    );
  });

  it('should include target path when provided in production', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://tokossonlineshop.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/checkout');
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%3A%2F%2Ftokossonlineshop.com%2Fcheckout&app=ssonline'
    );
  });

  it('should append additional query params such as client_type', () => {
    vi.spyOn(envModule, 'environment', 'get').mockReturnValue({
      production: true,
      appUrl: 'https://tokossonlineshop.com',
      authUrl: 'https://tokosuburjaya.com:17801/bff/login',
      apiBaseUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1',
      apiUrl: 'https://tokosuburjaya.com:17801/ssonline/api/v1/',
      userPasswordApiUrl: 'https://tokosuburjaya.com:17801/api/UserPassword',
      posApiUrl: 'https://tokosuburjaya.com:17801/pos/',
      originCode: '32.71.10.8',
      dokuScriptUrl: '',
      dokuStyleUrl: ''
    });

    const url = getBffLoginUrl('/admin', { client_type: 'admin' });
    expect(url).toBe(
      'https://tokosuburjaya.com:17801/bff/login?returnUrl=%2Fredirect-to-frontend%3FreturnUrl%3Dhttps%3A%2F%2Ftokossonlineshop.com%2Fadmin&app=ssonline&client_type=admin'
    );
  });
});
