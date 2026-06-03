import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyRupiah',
  standalone: true
})
export class CurrencyRupiahPipe implements PipeTransform {
  transform(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return 'Rp 0';
    }
    return 'Rp ' + value.toLocaleString('id-ID');
  }
}
