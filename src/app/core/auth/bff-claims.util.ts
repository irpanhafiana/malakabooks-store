import { User } from '../models';
import { DecodedJwt, mapJwtToUser } from './jwt.util';

/** Satu entri dari respons `GET /bff/user` (Duende.BFF). */
export interface BffClaim {
  type: string;
  value: string | number;
}

/** Klaim khusus BFF: URL logout yang sudah membawa `sid`. */
export const BFF_LOGOUT_URL_CLAIM = 'bff:logout_url';

const CLAIM_TYPE_MAP: Record<string, string> = {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'sub',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'given_name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'email',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone': 'phone',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/otherphone': 'phone',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'role'
};

/**
 * Urai nilai klaim. Jika nilai berupa JSON array string (mis. string dengan kurung siku "[...]"),
 * kita coba parsing menjadi array string. Jika tidak, kembalikan array berisi string tunggal.
 */
function extractClaimValues(value: string | number): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v));
        }
      } catch {
        // Fallback jika bukan format JSON valid
      }
    }
    return [trimmed];
  }
  return [String(value)];
}

/**
 * Ubah array klaim menjadi bentuk record, sehingga bisa dipetakan lewat
 * `mapJwtToUser` yang sudah ada. Klaim yang muncul lebih dari sekali
 * (mis. `role`) dikumpulkan menjadi array — persis bentuknya di payload JWT.
 */
export function claimsToRecord(claims: BffClaim[]): DecodedJwt {
  const record: DecodedJwt = {};

  for (const claim of claims) {
    if (!claim?.type) continue;
    const rawType = claim.type;
    const normalizedType = CLAIM_TYPE_MAP[rawType] ?? rawType;

    const values = extractClaimValues(claim.value);

    for (const val of values) {
      // Simpan di bawah nama ternormalisasi
      const existingNorm = record[normalizedType];
      if (existingNorm === undefined) {
        record[normalizedType] = val;
      } else if (Array.isArray(existingNorm)) {
        existingNorm.push(val);
      } else {
        record[normalizedType] = [String(existingNorm), val];
      }

      // Simpan juga di bawah nama asli bila berbeda, agar fallback di tempat lain tetap berjalan
      if (rawType !== normalizedType) {
        const existingRaw = record[rawType];
        if (existingRaw === undefined) {
          record[rawType] = val;
        } else if (Array.isArray(existingRaw)) {
          existingRaw.push(val);
        } else {
          record[rawType] = [String(existingRaw), val];
        }
      }
    }
  }

  return record;
}

/** Petakan respons `/bff/user` menjadi User aplikasi. Null bila tidak valid. */
export function mapClaimsToUser(claims: BffClaim[] | null | undefined): User | null {
  if (!Array.isArray(claims) || claims.length === 0) return null;
  return mapJwtToUser(claimsToRecord(claims));
}

/**
 * Duende menyisipkan `bff:logout_url` lengkap dengan `sid`. Logout tanpa `sid`
 * ditolak BFF, jadi nilai ini yang harus dipakai bila tersedia.
 */
export function readLogoutUrl(claims: BffClaim[] | null | undefined): string | null {
  if (!Array.isArray(claims)) return null;
  const claim = claims.find(c => c?.type === BFF_LOGOUT_URL_CLAIM || c?.type === 'bff:logout_url');
  return typeof claim?.value === 'string' && claim.value.length > 0 ? claim.value : null;
}
