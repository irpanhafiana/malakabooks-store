import { User } from '../models';

export interface DecodedJwt {
  sub?: string;
  nameid?: string;
  given_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  avatar?: string;
  joined_at?: string;
  role?: string | string[];
  exp?: number;
  [claim: string]: unknown;
}

/** Decode the JWT payload. Returns null when the token is malformed. */
export function decodeJwt(token: string | null | undefined): DecodedJwt | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as DecodedJwt;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  const decoded = decodeJwt(token);
  if (!decoded) return true;
  // exp is a Unix timestamp in seconds.
  return decoded.exp ? decoded.exp * 1000 < Date.now() : false;
}

/** Returns true when the decoded role claim contains an admin role. */
export function jwtHasAdminRole(decoded: DecodedJwt | null): boolean {
  if (!decoded) return false;
  const roles =
    decoded.role ??
    (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | string[]) ??
    (decoded['roles'] as string | string[]) ??
    [];

  const matches = (roleName: string) => {
    if (Array.isArray(roles)) {
      return roles.some(r => typeof r === 'string' && r.toLowerCase() === roleName.toLowerCase());
    }
    if (typeof roles === 'string') {
      return roles.toLowerCase() === roleName.toLowerCase();
    }
    return false;
  };

  const containsAdmin = () => {
    if (Array.isArray(roles)) {
      return roles.some(r => typeof r === 'string' && r.toLowerCase().includes('admin'));
    }
    if (typeof roles === 'string') {
      return roles.toLowerCase().includes('admin');
    }
    return false;
  };

  return matches('SSOnline-Admin') || matches('Malaka-Admin') || matches('admin') || containsAdmin();
}

export function mapJwtToUser(decoded: DecodedJwt | null): User | null {
  if (!decoded) return null;
  const userId =
    decoded.sub ||
    decoded.nameid ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ||
    (decoded['id'] as string) ||
    (decoded['userId'] as string) ||
    (decoded['user_id'] as string);

  if (!userId) return null;

  const name =
    decoded.given_name ||
    decoded.name ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] as string) ||
    'User';

  const email =
    decoded.email ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string) ||
    '';

  const rawName = (decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) as string | undefined;

  const phone =
    decoded.phone_number ||
    decoded.phone ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] as string) ||
    (decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/otherphone'] as string) ||
    (typeof rawName === 'string' && /^\+?\d{8,15}$/.test(rawName.trim()) ? rawName.trim() : '') ||
    (typeof name === 'string' && !name.includes('@') && /^\+?\d{8,15}$/.test(name.trim()) ? name.trim() : '');

  return {
    id: String(userId),
    name: String(name),
    email: String(email),
    role: jwtHasAdminRole(decoded) ? 'admin' : 'customer',
    phone: String(phone),
    avatar: String(decoded.avatar || ''),
    joinedAt: String(decoded.joined_at || new Date().toISOString()),
    addresses: []
  };
}
