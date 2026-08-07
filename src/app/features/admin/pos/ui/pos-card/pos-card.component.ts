import { Component, input, HostBinding } from '@angular/core';

/**
 * Kartu panel POS. API identik dengan `app-card` sj-pos agar template
 * sub-komponen transaksi bisa disalin apa adanya; hanya kelas Tailwind
 * default-nya yang mengikuti tema malakabooks (rounded-2xl, border slate-200).
 */
@Component({
  selector: 'app-pos-card',
  standalone: true,
  templateUrl: './pos-card.component.html'
})
export class PosCardComponent {
  title = input<string>();
  icon = input<string>();
  padding = input<string>('p-5');
  headerClass = input<string>('px-5 py-4 border-b border-slate-100 flex items-center justify-between');
  customClass = input<string>('bg-white rounded-2xl border border-slate-200 overflow-hidden relative');

  @HostBinding('class') get hostClass() {
    return 'block flex flex-col ' + this.customClass();
  }
}
