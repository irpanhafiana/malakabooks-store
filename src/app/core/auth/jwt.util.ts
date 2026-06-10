import { User } from '../models';

/**
 * Stateless helpers for working with the IdentityServer4 / OAuth access token.
 * Centralised here so the interceptor and the AuthStore share one implementation
 * instead of each re-deriving the decode/expiry logic (DRY / single source of truth).
 */

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

/**
 * True when the token is missing, malformed, or past its `exp` claim.
 * A token without an `exp` claim is treated as non-expiring (returns false).
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  const decoded = decodeJwt(token);
  if (!decoded) return true;
  // exp is a Unix timestamp in seconds.
  return decoded.exp ? decoded.exp * 1000 < Date.now() : false;
}

/** Returns true when the decoded role claim contains an admin role. */
export function jwtHasAdminRole(decoded: DecodedJwt | null): boolean {
  const roles = decoded?.role ?? [];
  const matches = (roleName: string) => {
    if (Array.isArray(roles)) {
      return roles.some(r => r.toLowerCase() === roleName.toLowerCase());
    }
    if (typeof roles === 'string') {
      return roles.toLowerCase() === roleName.toLowerCase();
    }
    return false;
  };
  return matches('Malaka-Admin') || matches('admin');
}

/**
 * Build the application `User` from a decoded token.
 * Returns null when the token does not carry a usable user id, so callers can
 * reject the session rather than trusting a partially-formed identity.
 */
export function mapJwtToUser(decoded: DecodedJwt | null): User | null {
  if (!decoded) return null;
  const userId = decoded.sub || decoded.nameid;
  if (!userId) return null;

  const name = decoded.given_name || decoded.name || 'User';
  return {
    id: userId,
    name,
    email: decoded.email || '',
    role: jwtHasAdminRole(decoded) ? 'admin' : 'customer',
    phone:
      decoded.phone_number ||
      decoded.phone ||
      (decoded.name && !decoded.name.includes('@') ? decoded.name : ''),
    avatar: decoded.avatar || '',
    joinedAt: decoded.joined_at || new Date().toISOString(),
    addresses: []
  };
}
