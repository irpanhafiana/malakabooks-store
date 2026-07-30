import { environment } from '../../../environments/environment';

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const serverOrigin = environment.apiBaseUrl.replace(/\/api\/v\d+.*$/i, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${serverOrigin}${path}`;
}
