import { environment } from '../../../environments/environment';

/**
 * Kunci localStorage sesi POS.
 *
 * Nama-nama ini SENGAJA dipertahankan sama persis dengan aplikasi sj-pos-katalog:
 * `TransactionValidationService`, `ReceiptPrintService`, dan komponen transaksi
 * membacanya secara langsung. Mengganti nama akan mematikan validasi kredit,
 * persentase non-rokok, tanggal bisnis, dan header struk.
 */
export const POS_TOKEN_KEY = 'sj_pos_token';
export const POS_USERNAME_KEY = 'sj_katalog_username';
export const POS_BIZ_DATES_KEY = 'sj_business_dates';
export const POS_BRANCH_KEY = 'sj_default_branch';
export const POS_USER_DATA_KEY = 'sj_user_data';
export const POS_SAP_USERNAME_KEY = 'sj_pos_username';
export const POS_NON_ROKOK_PERCENT_KEY = 'sj_non_rokok_percentage';

/**
 * True bila URL menuju gateway POS (SAP), bukan MalakaBooks.API.
 *
 * Dipakai seluruh interceptor untuk memisahkan dua sesi auth yang hidup
 * berdampingan di aplikasi ini: token IdentityServer MalakaBooks tidak boleh
 * bocor ke gateway POS, dan sebaliknya.
 */
export function isPosApiUrl(url: string): boolean {
  return (
    url.startsWith(environment.posApiUrl) ||
    url.startsWith(environment.posOutstandingUrl) ||
    url.startsWith(environment.posAuthUrl)
  );
}

export function getPosToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(POS_TOKEN_KEY);
}

export function clearPosSession(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(POS_TOKEN_KEY);
  localStorage.removeItem(POS_USER_DATA_KEY);
  localStorage.removeItem(POS_BIZ_DATES_KEY);
  localStorage.removeItem(POS_BRANCH_KEY);
  localStorage.removeItem(POS_SAP_USERNAME_KEY);
  localStorage.removeItem(POS_NON_ROKOK_PERCENT_KEY);
}
