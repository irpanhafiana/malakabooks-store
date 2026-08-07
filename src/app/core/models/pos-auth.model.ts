/**
 * Model auth gateway POS (SAP). Terpisah dari model auth MalakaBooks
 * (`src/app/core/models/user.model.ts`) karena bentuk respons OAuth-nya berbeda.
 */
export interface PosLoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  userName?: string;
  client_id?: string;
}

export interface PosUserData {
  Id?: number;
  Username?: string;
  Name?: string;
  Role?: string;
  BranchCode?: string;
  /** Menentukan apakah kasir boleh melakukan transaksi kredit/piutang. */
  isCanDoCreditTransaction?: boolean;
  [key: string]: unknown;
}
