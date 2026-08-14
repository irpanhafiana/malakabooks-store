import { environment } from '../../../environments/environment';

/**
 * Membangun URL redirect login BFF Duende sesuai spesifikasi backend.
 *
 * Di production (ketika environment.appUrl terisi), returnUrl dibungkus
 * melalui `/redirect-to-frontend?returnUrl=<targetUrl>` agar BFF server-side
 * dapat memvalidasi local redirect sebelum meneruskannya kembali ke domain frontend.
 *
 * @param targetPath Path atau URL tujuan setelah login (default: '/')
 * @param additionalParams Parameter query tambahan (misal: { client_type: 'admin' })
 */
export function getBffLoginUrl(
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
  const separator = environment.authUrl.includes('?') ? '&' : '?';
  
  let url = `${environment.authUrl}${separator}returnUrl=${encodedReturnUrl}&app=ssonline`;

  for (const [key, value] of Object.entries(additionalParams)) {
    if (value !== undefined && value !== null) {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
  }

  return url;
}
