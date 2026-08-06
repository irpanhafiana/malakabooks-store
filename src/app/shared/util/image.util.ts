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

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
