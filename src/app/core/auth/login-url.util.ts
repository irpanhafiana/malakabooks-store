import { environment } from '../../../environments/environment';

/**
 * Membangun URL BFF (login / logout) Duende sesuai spesifikasi backend.
 *
 * Di production (ketika environment.appUrl terisi), returnUrl dibungkus
 * melalui `/redirect-to-frontend?returnUrl=<targetUrl>` agar BFF server-side
 * dapat memvalidasi local redirect sebelum meneruskannya kembali ke domain frontend.
 *
 * @param action 'login' atau 'logout'
 * @param targetPath Path atau URL tujuan setelah aksi (default: '/')
 * @param additionalParams Parameter query tambahan (misal: { client_type: 'admin' })
 */
export function getBffAuthUrl(
  action: 'login' | 'logout',
  targetPath: string = '/',
  additionalParams: Record<string, string> = {}
): string {
  // Format URL tujuan akhir
  let finalTarget: string;
  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    finalTarget = targetPath;
  } else if (environment.appUrl) {
    const cleanPath = targetPath === '/' ? '' : (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
    finalTarget = `${environment.appUrl}${cleanPath}`;
  } else {
    finalTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  }

  // Jika appUrl diset (production), bungkus melalui /redirect-to-frontend
  const bffReturnPath = environment.appUrl
    ? `/redirect-to-frontend?returnUrl=${encodeURIComponent(finalTarget)}`
    : finalTarget;

  const encodedReturnUrl = encodeURIComponent(bffReturnPath);
  
  const baseUrl = environment.authUrl.includes('/login')
    ? environment.authUrl.replace('/login', `/${action}`)
    : `${environment.authUrl}/${action}`;

  const separator = baseUrl.includes('?') ? '&' : '?';
  
  let url = `${baseUrl}${separator}returnUrl=${encodedReturnUrl}&app=ssonline`;

  for (const [key, value] of Object.entries(additionalParams)) {
    if (value !== undefined && value !== null) {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
  }

  return url;
}

export function getBffLoginUrl(
  targetPath: string = '/',
  additionalParams: Record<string, string> = {}
): string {
  return getBffAuthUrl('login', targetPath, additionalParams);
}

export function getBffLogoutUrl(
  targetPath: string = '/',
  additionalParams: Record<string, string> = {}
): string {
  return getBffAuthUrl('logout', targetPath, additionalParams);
}

/**
 * Menyusun URL logout final yang memperhitungkan klaim `bff:logout_url` (yang sudah membawa `sid`).
 * Jika klaim tersedia:
 * 1. Menjaga query params bawaan BFF (misal `sid=xxx`).
 * 2. Mengubah relative URL menjadi full URL berbasis BFF jika host berbeda.
 * 3. Menambahkan parameter `returnUrl` (dibungkus `/redirect-to-frontend` jika production) & `app=ssonline`.
 * Jika klaim tidak tersedia:
 * Menggunakan fallback URL logout standar melalui `getBffLogoutUrl(targetPath)`.
 */
export function resolveBffLogoutUrl(
  claimLogoutUrl?: string | null,
  targetPath: string = '/'
): string {
  if (!claimLogoutUrl) {
    return getBffLogoutUrl(targetPath);
  }

  let finalTarget: string;
  if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
    finalTarget = targetPath;
  } else if (environment.appUrl) {
    const cleanPath = targetPath === '/' ? '' : (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);
    finalTarget = `${environment.appUrl}${cleanPath}`;
  } else {
    finalTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  }

  const bffReturnPath = environment.appUrl
    ? `/redirect-to-frontend?returnUrl=${encodeURIComponent(finalTarget)}`
    : finalTarget;

  let url = claimLogoutUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const bffOrigin = environment.authUrl.replace(/\/bff\/(login|logout|user).*/i, '');
    url = `${bffOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  if (!url.includes('returnUrl=')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}returnUrl=${encodeURIComponent(bffReturnPath)}`;
  }

  if (!url.includes('app=')) {
    url += '&app=ssonline';
  }

  return url;
}

