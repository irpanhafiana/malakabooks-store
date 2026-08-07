import { Injectable } from '@angular/core';
import { PosCustomer, PosCartItem } from '../models/pos.model';
import { POS_BRANCH_KEY, POS_NON_ROKOK_PERCENT_KEY, POS_USER_DATA_KEY } from '../auth/pos-session.util';

export interface NonRokokStats {
  total: number;
  nonRokokTotal: number;
  current: number;
  required: number;
  isViolated: boolean;
}

/**
 * Aturan bisnis kredit & poin kasir. Port utuh dari
 * `sj-pos-katalog/src/app/core/services/transaction-validation.service.ts`.
 *
 * Sumber datanya adalah localStorage yang diisi PosAuthService saat login POS
 * (`sj_user_data`, `sj_default_branch`, `sj_non_rokok_percentage`).
 */
@Injectable({ providedIn: 'root' })
export class TransactionValidationService {

  getCashierCreditPermission(): boolean {
    const userDataStr = localStorage.getItem(POS_USER_DATA_KEY);
    if (!userDataStr) return false;
    try {
      const userData = JSON.parse(userDataStr);
      return userData.isCanDoCreditTransaction === true;
    } catch {
      return false;
    }
  }

  getActiveApprovalScheme(
    customer: PosCustomer | null,
    outstandingBillsCount: number,
    totalOutstandingAmount: number,
    totalBayar: number,
    uangDiterima: number
  ): string | null {
    if (!customer) return null;

    const outstandingBillsLimit = customer.OutstandingBills || customer.outstandingBills || 0;
    if (outstandingBillsCount >= outstandingBillsLimit && outstandingBillsLimit > 0) {
      return 'OUTSTANDING_BILL';
    }

    const creditLimit = customer.CreditLimit || customer.creditLimit || 0;
    const currentDebtRequest = Math.max(0, totalBayar - uangDiterima);
    if (creditLimit > 0 && (totalOutstandingAmount + currentDebtRequest) > creditLimit) {
      return 'CREDIT_LIMIT';
    }

    return null;
  }

  getCreditRestrictionReason(
    customer: PosCustomer | null,
    isCreditBypassed: boolean,
    creditMemoBalance: number,
    outstandingBillsCount: number,
    totalOutstandingAmount: number,
    totalBayar: number,
    uangDiterima: number
  ): string {
    if (isCreditBypassed) return '';
    if (!customer) return '';

    const canCashierDoCredit = this.getCashierCreditPermission();
    const limitValue = customer.LimitType || customer.limitType;
    const isLimitType3 = limitValue == 3 || limitValue == '3' || limitValue == 'L3';
    const hasCreditMemo = creditMemoBalance > 0;

    const outstandingBillsLimit = customer.OutstandingBills || customer.outstandingBills || 0;
    const isLimitReached = outstandingBillsCount >= outstandingBillsLimit && outstandingBillsLimit > 0;

    const creditLimit = customer.CreditLimit || customer.creditLimit || 0;
    const currentDebtRequest = Math.max(0, totalBayar - uangDiterima);
    const isCreditLimitExceeded = creditLimit > 0 && (totalOutstandingAmount + currentDebtRequest) > creditLimit;

    if (!canCashierDoCredit) return 'Kasir tidak memiliki otoritas kredit.';
    if (hasCreditMemo) return 'Pelanggan masih memiliki Saldo Piutang (Credit Memo).';
    if (isLimitType3) return 'Pelanggan tipe L3 (Wajib Bayar Lunas).';
    if (isLimitReached) return `Batas Nota tercapai (${outstandingBillsCount}/${outstandingBillsLimit}).`;
    if (isCreditLimitExceeded) return `Batas Credit Limit terlampaui.`;

    return '';
  }

  getNonRokokStats(items: PosCartItem[]): NonRokokStats {
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    const nonRokokTotal = items.filter(i => !i.isRokok).reduce((sum, i) => sum + i.subtotal, 0);
    const percent = total > 0 ? (nonRokokTotal / total) * 100 : 100;

    const storedPercent = localStorage.getItem(POS_NON_ROKOK_PERCENT_KEY);
    const required = storedPercent ? parseFloat(storedPercent) : 0;

    return {
      total,
      nonRokokTotal,
      current: percent,
      required,
      isViolated: percent < required && total > 0
    };
  }

  calculateCustomerPoints(
    customer: PosCustomer | null,
    customerCode: string,
    items: PosCartItem[],
    uangDiterima: number,
    totalBayar: number
  ): number {
    if (!customer || !customerCode) return 0;

    const barcode = customer.membershipBarcode || customer.MembershipBarcode || '';
    if (barcode.toUpperCase().startsWith('NON')) {
      return 0;
    }

    const branchCodeStr = localStorage.getItem(POS_BRANCH_KEY);
    if (!branchCodeStr) return 0;

    let branchConfig: any;
    try {
      branchConfig = JSON.parse(branchCodeStr);
    } catch {
      return 0;
    }

    let totalRokok = 0;
    let totalNonRokok = 0;

    for (const item of items) {
      if (item.isRokok) {
        totalRokok += item.subtotal;
      } else {
        totalNonRokok += item.subtotal;
      }
    }

    const limitValue = customer.LimitType || customer.limitType;
    const isLimitType3 = limitValue == 3 || limitValue == '3' || limitValue == 'L3';
    const groupType = customer.BPGroup?.GroupType;
    const hasCreditCapability = groupType === 'DEBT' || (!groupType && (customer.creditLimit || customer.CreditLimit || 0) > 0);
    const canDoCredit = hasCreditCapability && !isLimitType3;
    const hasShortage = uangDiterima < totalBayar;
    const isCreditTx = canDoCredit && hasShortage;

    const rokokDivisor = isCreditTx ? branchConfig.NominalPerPointRokokCredit : branchConfig.NominalPerPointRokok;
    const nonRokokDivisor = isCreditTx ? branchConfig.NominalPerPointNonRokokCredit : branchConfig.NominalPerPointNonRokok;

    let points = 0;
    if (rokokDivisor > 0) points += Math.floor(totalRokok / rokokDivisor);
    if (nonRokokDivisor > 0) points += Math.floor(totalNonRokok / nonRokokDivisor);

    return points;
  }
}
