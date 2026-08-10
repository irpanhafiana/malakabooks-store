import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { B2cOrderStore } from '../../store/b2c-order.store';

export const katalogCheckoutAbandonGuard: CanDeactivateFn<unknown> = () => {
  const b2cOrderStore = inject(B2cOrderStore);
  if (b2cOrderStore.lastOrderId()) {
    return confirm('Anda memiliki transaksi pembayaran yang sedang berjalan. Apakah Anda yakin ingin membatalkannya dan meninggalkan halaman ini?');
  }
  return true;
};
