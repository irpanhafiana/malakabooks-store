import { describe, it, expect } from 'vitest';
import { convertToParamMap } from '@angular/router';
import { sanitizeReturnUrl, readReturnUrl } from './return-url.util';

describe('sanitizeReturnUrl', () => {
  it('accepts a relative path', () => {
    expect(sanitizeReturnUrl('/checkout')).toBe('/checkout');
    expect(sanitizeReturnUrl('/product/123?ref=a')).toBe('/product/123?ref=a');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeReturnUrl('https://evil.com')).toBeNull();
    expect(sanitizeReturnUrl('//evil.com')).toBeNull();
    expect(sanitizeReturnUrl('/\\evil.com')).toBeNull();
    expect(sanitizeReturnUrl('/path\\..\\evil')).toBeNull();
  });

  it('rejects empty and non-rooted values', () => {
    expect(sanitizeReturnUrl(null)).toBeNull();
    expect(sanitizeReturnUrl('')).toBeNull();
    expect(sanitizeReturnUrl('checkout')).toBeNull();
  });
});

describe('readReturnUrl', () => {
  it('prefers returnUrl over redirect', () => {
    const params = convertToParamMap({ returnUrl: '/cart', redirect: '/profile' });
    expect(readReturnUrl(params)).toBe('/cart');
  });

  it('falls back to redirect', () => {
    expect(readReturnUrl(convertToParamMap({ redirect: '/profile' }))).toBe('/profile');
  });

  it('ignores an unsafe returnUrl and keeps looking', () => {
    const params = convertToParamMap({ returnUrl: 'https://evil.com', redirect: '/profile' });
    expect(readReturnUrl(params)).toBe('/profile');
  });

  it('returns null when nothing usable is present', () => {
    expect(readReturnUrl(convertToParamMap({}))).toBeNull();
  });
});
