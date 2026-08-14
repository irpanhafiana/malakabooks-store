import { ParamMap } from '@angular/router';
import { environment } from '../../../environments/environment';

/** Query param yang dipakai memindahkan tujuan asal melintasi redirect login. */
const RETURN_URL_PARAMS = ['returnUrl', 'redirect'] as const;

/**
 * Hanya izinkan path relatif (`/checkout`) atau URL absolut ke domain sendiri.
 *
 * Menolak URL ke domain lain, protocol-relative (`//evil.com`), dan
 * backslash yang sebagian browser normalisasi menjadi garis miring — semuanya
 * jalur open redirect setelah login.
 */
export function sanitizeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (environment.appUrl && trimmed.startsWith(environment.appUrl)) {
    const path = trimmed.slice(environment.appUrl.length) || '/';
    return sanitizeReturnUrl(path);
  }

  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;
  if (trimmed.includes('\\')) return null;
  return trimmed;
}

/** Ambil tujuan kembali yang aman dari query param, atau null bila tidak ada. */
export function readReturnUrl(params: ParamMap): string | null {
  for (const key of RETURN_URL_PARAMS) {
    const candidate = sanitizeReturnUrl(params.get(key));
    if (candidate) return candidate;
  }
  return null;
}
