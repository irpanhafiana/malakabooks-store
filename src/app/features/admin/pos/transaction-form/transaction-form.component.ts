import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, switchMap, of } from 'rxjs';
import Swal from 'sweetalert2';

import { PosProductService } from '../../../../core/services/pos-product.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionValidationService } from '../../../../core/services/transaction-validation.service';
import { ReceiptPrintService } from '../../../../core/services/receipt-print.service';
import { PosAuthService } from '../../../../core/services/pos-auth.service';
import { PosProduct, PosCartItem, PosCustomer } from '../../../../core/models/pos.model';
import { POS_BIZ_DATES_KEY } from '../../../../core/auth/pos-session.util';

import { PosQrDialogComponent } from '../ui/pos-qr-dialog/pos-qr-dialog.component';
import { TransactionCustomerCardComponent } from './components/transaction-customer-card/transaction-customer-card.component';
import { TransactionProductSearchComponent } from './components/transaction-product-search/transaction-product-search.component';
import { TransactionCartTableComponent } from './components/transaction-cart-table/transaction-cart-table.component';
import { TransactionPaymentModalComponent } from './components/transaction-payment-modal/transaction-payment-modal.component';

interface ActiveRow {
  rowId: string;
  productId: string;
  basedSalesOrderDetailId?: number;
}

/**
 * Halaman kasir POS.
 *
 * Port dari `sj-pos-katalog/src/app/pages/transaction/transaction-form`.
 * Endpoint, parameter, dan bentuk payload dipertahankan identik — perubahan di
 * sini akan membuat gateway SAP menolak dokumen.
 *
 * Satu baris keranjang = satu `ActiveRow`, dan satu produk boleh muncul di
 * beberapa baris (mis. sebagian sudah siap, sebagian masih diambil gudang).
 * Karena itu kuantitas disimpan di `inputState` yang di-key rowId, sedangkan
 * harga di `unitPrices` yang di-key productId.
 */
@Component({
  selector: 'app-pos-transaction-form',
  standalone: true,
  imports: [
    FormsModule,
    PosQrDialogComponent,
    TransactionCustomerCardComponent,
    TransactionProductSearchComponent,
    TransactionCartTableComponent,
    TransactionPaymentModalComponent
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css'
})
export class TransactionFormComponent implements OnInit {
  productService = inject(PosProductService);
  customerService = inject(CustomerService);
  transactionService = inject(TransactionService);
  validationService = inject(TransactionValidationService);
  receiptPrintService = inject(ReceiptPrintService);
  authService = inject(PosAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loadedSalesOrder = signal<any>(null);
  private rowCounter = 0;

  // --- Pencarian produk (SIAP / kasir) ---
  searchQueryReady = signal<string>('');
  isSearchReadyFocused = signal<boolean>(false);
  productReadySelectedIndex = signal<number>(0);

  // --- Pencarian produk (TAMBAHAN / gudang) ---
  searchQueryPicking = signal<string>('');
  isSearchPickingFocused = signal<boolean>(false);
  productPickingSelectedIndex = signal<number>(0);

  availableProducts = signal<PosProduct[]>([]);
  totalProductsLoaded = signal<number>(0);
  isInitialLoading = signal<boolean>(false);

  // --- Pelanggan ---
  customerCode = signal<string>('RetailWS');
  customerData = signal<PosCustomer | null>(null);
  customerCreditMemoBalance = signal<number>(0);
  customerOutstandingBillsCount = signal<number>(0);
  customerTotalOutstandingAmount = signal<number>(0);
  customerSearchQuery = signal<string>('');
  availableCustomers = signal<PosCustomer[]>([]);
  totalCustomersLoaded = signal<number>(0);
  isCustomerInitialLoading = signal<boolean>(false);
  isCustomerSearchFocused = signal<boolean>(false);
  customerSelectedIndex = signal<number>(0);
  isCreditBypassed = signal<boolean>(false);
  isNonRokokBypassed = signal<boolean>(false);

  activeApprovalScheme = computed(() => {
    return this.validationService.getActiveApprovalScheme(
      this.customerData(),
      this.customerOutstandingBillsCount(),
      this.customerTotalOutstandingAmount(),
      this.totalBayar(),
      this.uangDiterima()
    );
  });

  nonRokokStats = computed(() => {
    return this.validationService.getNonRokokStats(this.cartItemsFromInput());
  });

  creditRestrictionReason = computed(() => {
    return this.validationService.getCreditRestrictionReason(
      this.customerData(),
      this.isCreditBypassed(),
      this.customerCreditMemoBalance(),
      this.customerOutstandingBillsCount(),
      this.customerTotalOutstandingAmount(),
      this.totalBayar(),
      this.uangDiterima()
    );
  });

  // --- Keranjang & harga ---
  activeRows = signal<ActiveRow[]>([]);
  inputState = signal<Record<string, Record<string, number>>>({}); // key: rowId
  unitPrices = signal<Record<string, Record<string, number>>>({}); // key: productId
  itemReadyState = signal<Record<string, boolean>>({});

  uomColumns = [
    { label: 'EXTRA', level: 3 },
    { label: 'BESAR', level: 2 },
    { label: 'SEDANG', level: 1 },
    { label: 'KECIL', level: 0 }
  ];

  // --- Pembayaran & ringkasan ---
  isQrDialogOpen = signal(false);
  isPaymentModalOpen = signal(false);
  showPickingPanel = signal(false);

  paymentMethod = signal('Tunai');
  uangDiterima = signal(0);
  remarks = signal('');
  businessDate = signal<string | null>(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(POS_BIZ_DATES_KEY)
  );

  docDate = signal<string>('');
  deliveryDate = signal<string>('');
  dueDate = signal<string>('');

  // ════════ COMPUTED ════════

  searchReadyResults = computed(() => {
    const q = this.searchQueryReady().toLowerCase().trim();
    if (!q || q.length < 3) return [];

    const filtered = this.availableProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p as any).code?.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.barcode2 && p.barcode2.toLowerCase().includes(q)) ||
      (p.barcode3 && p.barcode3.toLowerCase().includes(q)) ||
      (p.barcode4 && p.barcode4.toLowerCase().includes(q))
    );

    const uniqueCodes = new Set<string>();
    const uniqueResults: PosProduct[] = [];
    for (const p of filtered) {
      const code = (p as any).code || p.id;
      if (!uniqueCodes.has(code)) {
        uniqueCodes.add(code);
        uniqueResults.push(p);
      }
    }
    return uniqueResults.slice(0, 15);
  });

  searchPickingResults = computed(() => {
    const q = this.searchQueryPicking().toLowerCase().trim();
    if (!q || q.length < 3) return [];

    const filtered = this.availableProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p as any).code?.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.barcode2 && p.barcode2.toLowerCase().includes(q)) ||
      (p.barcode3 && p.barcode3.toLowerCase().includes(q)) ||
      (p.barcode4 && p.barcode4.toLowerCase().includes(q))
    );

    const uniqueCodes = new Set<string>();
    const uniqueResults: PosProduct[] = [];
    for (const p of filtered) {
      const code = (p as any).code || p.id;
      if (!uniqueCodes.has(code)) {
        uniqueCodes.add(code);
        uniqueResults.push(p);
      }
    }
    return uniqueResults.slice(0, 15);
  });

  customerSearchResults = computed(() => {
    const q = this.customerSearchQuery().toLowerCase().trim();
    if (!q || q.length < 2) return [];

    return this.availableCustomers().filter(c => {
      const name = (c.name || c.Name || c.CustomerName || '').toLowerCase();
      const code = (c.code || c.Code || c.id || c.Id || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    }).slice(0, 15);
  });

  activeProducts = computed(() => {
    const products = this.availableProducts();
    return this.activeRows()
      .map(row => {
        const product = products.find(p => p.id === row.productId);
        return product ? { ...product, rowId: row.rowId } : null;
      })
      .filter((p): p is PosProduct & { rowId: string } => p !== null);
  });

  subtotal = computed(() => {
    let total = 0;
    const state = this.inputState();
    const products = this.availableProducts();
    const rows = this.activeRows();

    for (const row of rows) {
      const uoms = state[row.rowId];
      if (!uoms) continue;

      const product = products.find(p => p.id === row.productId);
      if (!product) continue;

      for (const [uomName, qty] of Object.entries(uoms)) {
        if (qty > 0) {
          const detail = product.uomDetails?.find(d => d.name === uomName);
          const factor = detail?.conversion || 1;
          const fetchedPrice = this.unitPrices()[row.productId]?.[uomName];
          const actualPrice = (fetchedPrice && fetchedPrice > 0) ? fetchedPrice : (product.price * factor);
          total += (qty * actualPrice);
        }
      }
    }
    return total;
  });

  totalBayar = computed(() => this.subtotal());

  kembalian = computed(() => {
    if (this.paymentMethod() !== 'Tunai') return 0;
    return Math.max(0, this.uangDiterima() - this.totalBayar());
  });

  canProcess = computed(() => {
    if (!this.customerCode()) return false;
    const totalQty = Object.values(this.inputState()).reduce((sum, uoms) =>
      sum + Object.values(uoms).reduce((s, q) => s + q, 0), 0
    );
    if (totalQty === 0) return false;

    const total = this.totalBayar();
    const payment = this.uangDiterima();
    const customer = this.customerData();

    const canCashierDoCredit = this.validationService.getCashierCreditPermission();
    const creditMemoBalance = this.customerCreditMemoBalance();
    const hasCreditMemo = creditMemoBalance > 0;
    const limitValue = customer?.LimitType || customer?.limitType;
    const isLimitType3 = limitValue == 3 || limitValue == '3' || limitValue == 'L3';

    const isCreditShortage = payment < total;

    const outstandingBillsLimit = customer?.OutstandingBills || customer?.outstandingBills || 0;
    const outstandingInvoicesCount = this.customerOutstandingBillsCount();
    const isLimitReached = outstandingInvoicesCount >= outstandingBillsLimit && outstandingBillsLimit > 0;

    const creditLimit = customer?.CreditLimit || customer?.creditLimit || 0;
    const currentOutstandingTotal = this.customerTotalOutstandingAmount();
    const currentDebtRequest = total - payment;
    const isCreditLimitExceeded = creditLimit > 0 && (currentOutstandingTotal + currentDebtRequest) > creditLimit;

    let isCreditRestricted = !canCashierDoCredit || hasCreditMemo || isLimitType3 || isLimitReached || isCreditLimitExceeded;

    if (this.isCreditBypassed()) {
      isCreditRestricted = false;
    }

    if (isCreditShortage && (!customer || limitValue === undefined)) {
      return false;
    }

    if (isCreditRestricted && isCreditShortage) {
      return false;
    }

    return true;
  });

  canTunda = computed(() => {
    if (!this.customerCode()) return false;
    return this.cartItemsFromInput().length > 0;
  });

  cartItemsFromInput = computed(() => {
    const items: PosCartItem[] = [];
    const state = this.inputState();
    const products = this.availableProducts();
    const rows = this.activeRows();

    for (const row of rows) {
      const uoms = state[row.rowId];
      if (!uoms) continue;
      const product = products.find(p => p.id === row.productId);
      if (!product) continue;

      for (const [uomName, qty] of Object.entries(uoms)) {
        if (qty > 0) {
          const detail = product.uomDetails?.find(d => d.name === uomName);
          const levelLabel = this.uomColumns.find(c => c.level === detail?.package)?.label || uomName;
          const factor = detail?.conversion || 1;
          const fetchedPrice = this.unitPrices()[row.productId]?.[uomName];
          const actualPrice = (fetchedPrice && fetchedPrice > 0) ? fetchedPrice : (product.price * factor);

          items.push({
            id: product.id,
            name: product.name,
            uom: levelLabel,
            uomCode: detail?.name || uomName,
            qty: qty,
            price: actualPrice,
            subtotal: qty * actualPrice,
            conversion: factor,
            itemGroupCode: product.itemGroupCode || '',
            isRokok: product.isRokok || false,
            basedSalesOrderDetailId: row.basedSalesOrderDetailId
          });
        }
      }
    }
    return items;
  });

  customerPoints = computed(() => {
    return this.validationService.calculateCustomerPoints(
      this.customerData(),
      this.customerCode(),
      this.cartItemsFromInput(),
      this.uangDiterima(),
      this.totalBayar()
    );
  });

  // ════════ LIFECYCLE ════════

  ngOnInit() {
    this.refreshProducts();
    this.refreshCustomers();

    this.route.queryParams.subscribe(params => {
      const docNum = params['docNum'];
      if (docNum) {
        this.loadSalesOrder(docNum);
      } else {
        this.loadDefaultCustomer();
      }
    });

    this.productService.fetchDefaultBranch().subscribe({
      error: (err) => console.error('Error fetching Default Branch:', err)
    });

    const bDate = this.businessDate();
    const initialDate = bDate ? bDate.substring(0, 10) : this.formatDate(new Date());
    this.docDate.set(initialDate);
    this.deliveryDate.set(initialDate);
    this.dueDate.set(initialDate);
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Tanggal kirim & jatuh tempo diturunkan dari hari-hari yang diizinkan pada
   * master pelanggan (`DeliveryDays`/`PaymentDays`, format "1,3,5" = hari minggu),
   * dengan fallback `PaymentDueDays` berupa jumlah hari.
   */
  recalculateDerivedDates() {
    const customer = this.customerData();
    if (!customer) return;

    const baseStr = this.docDate();
    if (!baseStr) return;

    const [y, m, d] = baseStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    const delDaysStr = customer.deliveryDays || customer.DeliveryDays || '';
    const payDaysStr = customer.paymentDays || customer.PaymentDays || '';
    const payDueDays = customer.paymentDueDays || customer.PaymentDueDays || 0;

    let delDate = new Date(baseDate.getTime());
    if (delDaysStr && delDaysStr.trim() !== "") {
      const allowedDays = delDaysStr.toString().split(',').map((s: string) => parseInt(s.trim(), 10));
      delDate = this.calculateTargetDate(baseDate, allowedDays);
    }
    this.deliveryDate.set(this.formatDate(delDate));

    let dueD = new Date(delDate.getTime());
    if (!payDaysStr || payDaysStr.toString().trim() === "") {
      if (payDueDays === 1) {
        dueD = new Date(delDate.getTime());
      } else {
        dueD.setDate(dueD.getDate() + payDueDays);
      }
    } else {
      const allowedPayDays = payDaysStr.toString().split(',').map((s: string) => parseInt(s.trim(), 10));
      dueD = this.calculateTargetDate(delDate, allowedPayDays);
    }
    this.dueDate.set(this.formatDate(dueD));
  }

  private calculateTargetDate(startDate: Date, allowedDays: number[]): Date {
    const currentDay = startDate.getDay();
    if (allowedDays.includes(currentDay)) {
      return new Date(startDate.getTime());
    }

    let nextDay = allowedDays.find(d => d > currentDay);
    if (nextDay === undefined) {
      const sorted = [...allowedDays].sort((a, b) => a - b);
      nextDay = sorted[0];
    }

    let diff = (nextDay + 7 - currentDay) % 7;
    if (diff === 0) diff = 7;

    const result = new Date(startDate.getTime());
    result.setDate(startDate.getDate() + diff);
    return result;
  }

  // ════════ PELANGGAN ════════

  refreshCustomers() {
    this.isCustomerInitialLoading.set(true);
    this.availableCustomers.set([]);
    this.totalCustomersLoaded.set(0);
    this.loadCustomerChunk(1);
  }

  /** Seluruh master pelanggan ditarik ke memori agar pencarian instan saat scan. */
  private loadCustomerChunk(page: number) {
    this.customerService.getAutoFillCustomers(page, 500).subscribe({
      next: (custs) => {
        if (custs.length > 0) {
          this.availableCustomers.update(current => [...current, ...custs]);
          this.totalCustomersLoaded.update(count => count + custs.length);
          if (custs.length === 500) this.loadCustomerChunk(page + 1);
          else this.isCustomerInitialLoading.set(false);
        } else {
          this.isCustomerInitialLoading.set(false);
        }
      },
      error: () => this.isCustomerInitialLoading.set(false)
    });
  }

  // ════════ PRODUK ════════

  refreshProducts() {
    this.isInitialLoading.set(true);
    this.availableProducts.set([]);
    this.totalProductsLoaded.set(0);
    this.loadChunk(1);
  }

  private loadChunk(page: number) {
    this.productService.getAutoFillProducts(page, 50).subscribe({
      next: (prods) => {
        if (prods.length > 0) {
          this.availableProducts.update(current => [...current, ...prods]);
          this.totalProductsLoaded.update(count => count + prods.length);
          if (prods.length === 50) this.loadChunk(page + 1);
          else this.isInitialLoading.set(false);
        } else {
          this.isInitialLoading.set(false);
        }
      },
      error: () => this.isInitialLoading.set(false)
    });
  }

  onSearchReadyChange(val: string) {
    this.searchQueryReady.set(val);
    this.productReadySelectedIndex.set(0);
  }

  onSearchPickingChange(val: string) {
    this.searchQueryPicking.set(val);
    this.productPickingSelectedIndex.set(0);
  }

  onProductReadyKeyDown(event: KeyboardEvent) {
    const results = this.searchReadyResults();
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.productReadySelectedIndex.update(idx => (idx + 1) % results.length);
      this.scrollToSelected('product-ready-results-container', this.productReadySelectedIndex());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.productReadySelectedIndex.update(idx => (idx - 1 + results.length) % results.length);
      this.scrollToSelected('product-ready-results-container', this.productReadySelectedIndex());
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[this.productReadySelectedIndex()];
      if (selected) this.selectItem(selected, true, this.searchQueryReady());
    }
  }

  onProductPickingKeyDown(event: KeyboardEvent) {
    const results = this.searchPickingResults();
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.productPickingSelectedIndex.update(idx => (idx + 1) % results.length);
      this.scrollToSelected('product-picking-results-container', this.productPickingSelectedIndex());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.productPickingSelectedIndex.update(idx => (idx - 1 + results.length) % results.length);
      this.scrollToSelected('product-picking-results-container', this.productPickingSelectedIndex());
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[this.productPickingSelectedIndex()];
      if (selected) this.selectItem(selected, false, this.searchQueryPicking());
    }
  }

  /**
   * Menambah baris keranjang. Bila query cocok persis dengan salah satu barcode,
   * kursor langsung melompat ke kolom UoM yang sesuai — barcode2 = level 1, dst.
   */
  selectItem(product: PosProduct, isReady: boolean = true, query: string = '') {
    const rowId = `row-${++this.rowCounter}`;
    this.activeRows.update(current => [...current, { rowId, productId: product.id }]);
    this.itemReadyState.update(prev => ({ ...prev, [rowId]: isReady }));

    let targetLevel = -1;
    const q = query.toLowerCase().trim();
    if (q) {
      if (product.barcode?.toLowerCase() === q) targetLevel = 0;
      else if (product.barcode2?.toLowerCase() === q) targetLevel = 1;
      else if (product.barcode3?.toLowerCase() === q) targetLevel = 2;
      else if (product.barcode4?.toLowerCase() === q) targetLevel = 3;
    }

    this.searchQueryReady.set('');
    this.searchQueryPicking.set('');

    this.inputState.update(prev => {
      const next = { ...prev };
      next[rowId] = {};
      product.uomOptions.forEach(u => next[rowId][u] = 0);
      return next;
    });

    if (product.uomDetails && !this.unitPrices()[product.id] && this.customerCode()) {
      product.uomDetails.forEach(detail => {
        this.productService.getPrice(this.customerCode(), product.id, detail.name).subscribe({
          next: (priceStr) => {
            const rawPrice = Number(priceStr);
            if (!isNaN(rawPrice)) {
              this.unitPrices.update(prev => {
                const next = { ...prev };
                if (!next[product.id]) next[product.id] = {};
                next[product.id][detail.name] = rawPrice;
                return next;
              });
            }
          }
        });
      });
    }

    setTimeout(() => {
      if (targetLevel !== -1) {
        const el = document.getElementById(`uom-${rowId}-${targetLevel}`);
        if (el) {
          (el as HTMLElement).focus();
          return;
        }
      }

      for (const col of this.uomColumns) {
        const detail = product.uomDetails?.find(d => d.package === col.level);
        if (detail) {
          const el = document.getElementById(`uom-${rowId}-${col.level}`);
          if (el) {
            (el as HTMLElement).focus();
            break;
          }
        }
      }
    }, 100);
  }

  updateInputState(rowId: string, uom: string, value: any) {
    const qty = Number(value);
    if (isNaN(qty) || qty < 0) return;
    this.inputState.update(prev => {
      const newState = { ...prev };
      if (!newState[rowId]) newState[rowId] = {};
      newState[rowId][uom] = qty;
      return newState;
    });
  }

  removeProduct(rowId: string) {
    this.activeRows.update(current => current.filter(r => r.rowId !== rowId));
    this.inputState.update(prev => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    this.itemReadyState.update(prev => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }

  toggleItemReady(rowId: string) {
    this.itemReadyState.update(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  }

  importB2COrder() {
    this.isQrDialogOpen.set(true);
  }

  /** Impor keranjang pesanan B2C hasil scan QR pelanggan. */
  processQrImport(orderId: string) {
    this.isQrDialogOpen.set(false);
    if (!orderId) return;

    Swal.fire({
      title: 'Mengambil Data Pesanan...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.transactionService.postB2CServiceGetItems([orderId]).subscribe({
      next: async (res) => {
        Swal.close();

        if (!res || res.length === 0 || !res[0].Content) {
          Swal.fire('Info', 'Pesanan tidak ditemukan atau data kosong.', 'info');
          return;
        }

        const b2cUsername = res[0].LastUpdatedBy || res[0].Remarks || '';
        let items: any[] = [];
        try {
          items = JSON.parse(res[0].Content);
        } catch (e) {
          console.error('Error parsing B2C Order Content:', e);
          Swal.fire('Error', 'Format data pesanan tidak valid.', 'error');
          return;
        }

        if (items.length === 0) {
          Swal.fire('Info', 'Pesanan ini tidak memiliki item.', 'info');
          return;
        }

        let addedCount = 0;
        for (const item of items) {
          const product = this.availableProducts().find(p => p.id === item.code);
          if (product) {
            let matchedUom = '';
            product.uomOptions.forEach(u => {
              if (u.toLowerCase() === item.uom.toLowerCase()) {
                matchedUom = u;
              }
            });
            if (!matchedUom) matchedUom = product.uomOptions[0] || '';

            const existingRow = this.activeRows().find(r => r.productId === product.id);
            let action = 'add_new_row';

            if (existingRow) {
              const resSwal = await Swal.fire({
                title: 'Produk Ganda',
                text: `Produk ${product.name} sudah ada di keranjang. Apa yang ingin Anda lakukan?`,
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Tambahkan Baris Baru',
                denyButtonText: 'Ganti (Dari HP)',
                cancelButtonText: 'Batal (Gunakan Keranjang)',
                confirmButtonColor: '#10B981',
                denyButtonColor: '#FE7743',
              });

              if (resSwal.isConfirmed) {
                action = 'add_new_row';
              } else if (resSwal.isDenied) {
                action = 'replace';
              } else {
                action = 'ignore';
              }
            }

            if (action === 'ignore') continue;

            if (action === 'replace' && existingRow) {
              this.inputState.update(prev => {
                const next = { ...prev };
                product.uomOptions.forEach(u => {
                  next[existingRow.rowId][u] = 0;
                });
                next[existingRow.rowId][matchedUom] = item.quantity;
                return next;
              });
              this.itemReadyState.update(prev => ({ ...prev, [existingRow.rowId]: false }));
              addedCount++;
            } else {
              const rowId = `row-${++this.rowCounter}`;
              this.activeRows.update(current => [...current, { rowId, productId: product.id }]);
              this.itemReadyState.update(prev => ({ ...prev, [rowId]: false }));

              this.inputState.update(prev => {
                const next = { ...prev };
                next[rowId] = {};
                product.uomOptions.forEach(u => {
                  next[rowId][u] = (u === matchedUom) ? item.quantity : 0;
                });
                return next;
              });

              if (item.price > 0 && matchedUom) {
                this.unitPrices.update(prev => {
                  const next = { ...prev };
                  if (!next[product.id]) next[product.id] = {};
                  next[product.id][matchedUom] = item.price;
                  return next;
                });
              }
              addedCount++;
            }

            if (product.uomDetails && this.customerCode()) {
              product.uomDetails.forEach(detail => {
                this.productService.getPrice(this.customerCode(), product.id, detail.name).subscribe({
                  next: (priceStr) => {
                    const rawPrice = Number(priceStr);
                    if (!isNaN(rawPrice) && rawPrice > 0) {
                      this.unitPrices.update(prev => {
                        const next = { ...prev };
                        if (!next[product.id]) next[product.id] = {};
                        next[product.id][detail.name] = rawPrice;
                        return next;
                      });
                    }
                  }
                });
              });
            }
          }
        }

        if (addedCount > 0) {
          const displayUsername = (b2cUsername && b2cUsername !== 'System') ? b2cUsername : 'Tamu';
          this.remarks.set(`A.N: ${displayUsername}`);
          Swal.fire('Berhasil', `${addedCount} item telah diimpor ke keranjang.`, 'success');
        } else {
          Swal.fire('Peringatan', 'Item dalam pesanan tidak ditemukan di master data lokal.', 'warning');
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Error importing B2C Order:', err);
        Swal.fire('Error', 'Gagal mengambil data pesanan. Pastikan ID benar dan server aktif.', 'error');
      }
    });
  }

  // ════════ UI PELANGGAN ════════

  onCustomerSearchChange(query: string) {
    this.customerSearchQuery.set(query);
    this.customerSelectedIndex.set(0);
  }

  onCustomerKeyDown(event: KeyboardEvent) {
    const results = this.customerSearchResults();
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.customerSelectedIndex.update(idx => (idx + 1) % results.length);
      this.scrollToSelected('customer-results-container', this.customerSelectedIndex());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.customerSelectedIndex.update(idx => (idx - 1 + results.length) % results.length);
      this.scrollToSelected('customer-results-container', this.customerSelectedIndex());
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[this.customerSelectedIndex()];
      if (selected) this.selectCustomer(selected);
    }
  }

  /** Ganti pelanggan: ambil data lengkap, saldo, tagihan terbuka, dan harga ulang. */
  selectCustomer(customer: any) {
    const code = customer.Code || customer.code || customer.Id || customer.id;
    this.customerCode.set(code);
    this.customerSearchQuery.set(customer.name || customer.Name || customer.CustomerName || code);

    this.customerService.getCustomer(code).subscribe({
      next: (fullData) => {
        this.customerData.set(fullData);
        this.recalculateDerivedDates();
      },
      error: (err) => {
        console.error('Error fetching full customer data:', err);
        this.customerData.set(customer);
        this.recalculateDerivedDates();
      }
    });

    this.customerService.getCustomerCreditMemoBalance(code).subscribe({
      next: (bal) => this.customerCreditMemoBalance.set(bal),
      error: (err) => console.error('Error fetching Credit Memo Balance:', err)
    });

    this.customerService.getOutstandingInvoices(code).subscribe({
      next: (list) => {
        this.customerOutstandingBillsCount.set(list?.length || 0);
        const total = (list || []).reduce((sum, inv) => sum + (inv.DocTotal || inv.docTotal || 0), 0);
        this.customerTotalOutstandingAmount.set(total);
      },
      error: (err) => console.error('Error fetching Outstanding Invoices:', err)
    });

    this.isCreditBypassed.set(false);
    this.isNonRokokBypassed.set(false);

    this.unitPrices.set({});
    for (const p of this.activeProducts()) {
      if (p.uomDetails) {
        p.uomDetails.forEach(detail => {
          this.productService.getPrice(this.customerCode(), p.id, detail.name).subscribe({
            next: (priceStr) => {
              const rawPrice = Number(priceStr);
              if (!isNaN(rawPrice)) {
                this.unitPrices.update(prev => {
                  const next = { ...prev };
                  if (!next[p.id]) next[p.id] = {};
                  next[p.id][detail.name] = rawPrice;
                  return next;
                });
              }
            }
          });
        });
      }
    }

    this.isCustomerSearchFocused.set(false);
    setTimeout(() => document.getElementById('product-ready-search-input')?.focus(), 50);
  }

  // ════════ CHECKOUT & TRANSAKSI ════════

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent) {
    // Jangan rebut tombol saat dialog SweetAlert2 sedang terbuka.
    if (document.querySelector('.swal2-container')) return;
    if (event.key === 'F1') {
      event.preventDefault();
      this.focusProductSearch();
    } else if (event.key === 'F2') {
      event.preventDefault();
      if (!this.isPaymentModalOpen() && this.activeRows().length > 0) {
        this.isPaymentModalOpen.set(true);
        setTimeout(() => this.focusPaymentInput(), 100);
      }
    } else if (event.key === 'Escape') {
      if (this.isPaymentModalOpen()) {
        event.preventDefault();
        this.isPaymentModalOpen.set(false);
      }
    } else if (event.key === 'F9') {
      event.preventDefault();
      if (this.canTunda()) {
        if (this.loadedSalesOrder()) {
          this.tundaLagi();
        } else {
          this.executeTunda();
        }
      }
    } else if (event.key === 'F8') {
      event.preventDefault();
      if (this.canProcess()) this.executePembayaran();
    } else if (event.key === 'F12') {
      event.preventDefault();
      this.resetTransaksi();
    }
  }

  focusProductSearch(event?: Event) {
    if (event) event.preventDefault();
    const inputId = this.showPickingPanel() ? 'product-picking-search-input' : 'product-ready-search-input';
    const el = document.getElementById(inputId);
    if (el) {
      (el as HTMLInputElement).focus();
      (el as HTMLInputElement).select();
    }
  }

  focusPaymentInput() {
    const el = document.getElementById('uang-diterima-input');
    if (el) {
      if (this.paymentMethod() !== 'Tunai') {
        this.paymentMethod.set('Tunai');
      }
      setTimeout(() => {
        (el as HTMLInputElement).focus();
        (el as HTMLInputElement).select();
      }, 50);
    }
  }

  scrollToSelected(containerId: string, index: number) {
    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const children = container.children;
      if (children && children[index]) {
        children[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  onUangDiterimaInput(event: any) {
    const input = event.target;
    const rawVal = input.value.replace(/[^0-9]/g, '');
    const num = parseInt(rawVal, 10) || 0;
    this.uangDiterima.set(num);
    input.value = this.formatNumber(num);
  }

  formatNumber(val: number): string {
    if (val === 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  private loadDefaultCustomer() {
    if (this.customerCode()) {
      const code = this.customerCode();
      this.customerService.getCustomer(code).subscribe({
        next: (res) => {
          if (!this.loadedSalesOrder()) {
            this.customerData.set(res);
            this.customerSearchQuery.set(res.name || res.CustomerName || res.Name || code);
          }
        },
        error: (err) => console.error('Error fetching Default Customer:', err)
      });

      this.customerService.getCustomerCreditMemoBalance(code).subscribe({
        next: (bal) => {
          if (!this.loadedSalesOrder()) this.customerCreditMemoBalance.set(bal);
        },
        error: (err) => console.error('Error fetching Credit Memo Balance:', err)
      });

      this.customerService.getOutstandingInvoices(code).subscribe({
        next: (list) => {
          if (!this.loadedSalesOrder()) {
            this.customerOutstandingBillsCount.set(list?.length || 0);
            const total = (list || []).reduce((sum, inv) => sum + (inv.DocTotal || inv.docTotal || 0), 0);
            this.customerTotalOutstandingAmount.set(total);
          }
        },
        error: (err) => console.error('Error fetching Outstanding Invoices:', err)
      });
    }
  }

  resetTransaksi(resetCustomer: boolean = true) {
    this.activeRows.set([]);
    this.inputState.set({});
    this.itemReadyState.set({});
    this.rowCounter = 0;
    this.uangDiterima.set(0);
    this.remarks.set('');
    this.isPaymentModalOpen.set(false);
    this.loadedSalesOrder.set(null);

    if (resetCustomer) {
      this.selectCustomer({ code: 'RetailWS', name: 'RetailWS' });
    }
  }

  /**
   * Gerbang validasi kredit sebelum dokumen dikirim. Mengembalikan false berarti
   * transaksi dibatalkan; pesan penolakan sudah ditampilkan ke kasir.
   */
  private async validateCheckout(): Promise<boolean> {
    const customer = this.customerData();
    const total = this.totalBayar();
    const payment = this.uangDiterima();
    const isCreditShortage = payment < total;

    if (isCreditShortage && this.isCreditBypassed()) return true;

    const creditMemoBalance = this.customerCreditMemoBalance();
    const usablePayment = payment + creditMemoBalance;

    const requestApproval = async (scheme: string): Promise<boolean> => {
      const { value: password } = await Swal.fire({
        title: 'Otorisasi Diperlukan',
        text: `Meminta persetujuan untuk: ${scheme}`,
        input: 'password',
        inputPlaceholder: 'Masukkan password otorisasi',
        showCancelButton: true,
        confirmButtonText: 'Setujui',
        cancelButtonText: 'Batal'
      });
      return !!password;
    };

    const canCashierDoCredit = this.validationService.getCashierCreditPermission();
    const limitValue = customer?.LimitType || customer?.limitType;
    const isLimitType3 = limitValue == 3 || limitValue == '3' || limitValue == 'L3';
    const hasCreditMemo = creditMemoBalance > 0;

    const outstandingBillsLimit = customer?.OutstandingBills || customer?.outstandingBills || 0;
    const outstandingInvoicesCount = this.customerOutstandingBillsCount();
    const isLimitReached = outstandingInvoicesCount >= outstandingBillsLimit && outstandingBillsLimit > 0;

    const creditLimit = customer?.CreditLimit || customer?.creditLimit || 0;
    const currentOutstandingTotal = this.customerTotalOutstandingAmount();
    const currentDebtRequest = total - payment;
    const isCreditLimitExceeded = creditLimit > 0 && (currentOutstandingTotal + currentDebtRequest) > creditLimit;

    if (isCreditShortage) {
      if (!canCashierDoCredit) {
        await Swal.fire('Gagal', 'Anda tidak memiliki otoritas untuk melakukan transaksi Kredit/Piutang.', 'error');
        return false;
      }
      if (hasCreditMemo) {
        await Swal.fire('Gagal', 'Pelanggan masih memiliki Saldo Piutang (Credit Memo). Harap lunasi terlebih dahulu.', 'error');
        return false;
      }
      if (isLimitType3) {
        await Swal.fire('Gagal', 'Cash only! (Pelanggan dengan Limit Type 3 wajib bayar lunas).', 'error');
        return false;
      }
      if (isLimitReached) {
        await Swal.fire('Gagal', 'Cash only! (Batas nota jatuh tempo terlampaui).', 'error');
        return false;
      }
      if (isCreditLimitExceeded) {
        await Swal.fire('Gagal', `Cash only! (Batas Credit Limit terlampaui. Total Hutang: ${currentOutstandingTotal + currentDebtRequest} > Limit: ${creditLimit}).`, 'error');
        return false;
      }
    }

    const canDoCreditCustomer = customer?.BPGroup?.GroupType === 'DEBT';
    const allowedOutstanding = 3;
    if (canDoCreditCustomer) {
      if (this.customerOutstandingBillsCount() >= allowedOutstanding) {
        if (usablePayment < total) {
          await Swal.fire('Gagal', 'Pembayaran dengan Saldo tidak sesuai dengan Total', 'error');
          return false;
        }
      }
    }

    if (isCreditShortage && !this.isNonRokokBypassed()) {
      const stats = this.nonRokokStats();
      if (stats.isViolated) {
        await Swal.fire('Gagal', `Persentase produk Non-Rokok (${stats.current.toFixed(2)}%) kurang dari batas minimum (${stats.required}%). Silakan minta persetujuan bypass di area keranjang.`, 'error');
        return false;
      }
    }

    if (canDoCreditCustomer) {
      if (isCreditShortage) {
        if (customer?.BPGroup?.GroupType !== 'DEBT') {
          if (payment < total) return false;
        }

        const updatedCustomer = await firstValueFrom(this.customerService.getCustomer(this.customerCode()));
        this.customerData.set(updatedCustomer);

        const outstandingInvoices = await firstValueFrom(this.customerService.getOutstandingInvoices(this.customerCode()));
        this.customerOutstandingBillsCount.set(outstandingInvoices?.length || 0);
        const totalOutstanding = (outstandingInvoices || []).reduce((sum, inv) => sum + (inv.DocTotal || inv.docTotal || 0), 0);
        this.customerTotalOutstandingAmount.set(totalOutstanding);

        if (this.customerOutstandingBillsCount() >= allowedOutstanding) {
          const { isConfirmed } = await Swal.fire({
            title: 'Cash only?',
            text: 'Batas nota jatuh tempo terlampaui. Tetap lanjutkan sebagai Cash?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya (Cash)',
            cancelButtonText: 'Tidak (Gunakan Kredit)'
          });

          if (!isConfirmed) {
            const approved = await requestApproval('CREDIT_LIMIT');
            if (!approved) return false;
          } else {
            if (isCreditShortage) {
              await Swal.fire('Gagal', 'Pembayaran harus penuh jika ingin menggunakan Cash Only', 'error');
              return false;
            }
          }
        }

        if (total > (customer?.CreditLimit || 0)) {
          await Swal.fire('Gagal', 'Total transaksi melampaui Credit Limit! (Cash only!)', 'error');
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Terbitkan Sales Invoice, lalu selesaikan antrian picking.
   *
   * Rantainya berurutan dan tidak boleh diringkas: GL account cash harus
   * diketahui sebelum payload dibentuk, dan `finishPicking` harus dipanggil
   * sebelum queue-nya bisa dibaca.
   */
  async executePembayaran(mode: 'checkout' | 'simpan' = 'simpan') {
    const isValid = await this.validateCheckout();
    if (!isValid) return;

    Swal.fire({
      title: 'Memproses Transaksi...', allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const items = this.cartItemsFromInput();
    const total = this.totalBayar();

    const readyState = this.itemReadyState();
    const readyCounts: Record<string, number> = {};
    let hasTambahan = false;
    this.activeRows().forEach(r => {
      if (readyState[r.rowId]) {
        readyCounts[r.productId] = (readyCounts[r.productId] || 0) + 1;
      } else {
        hasTambahan = true;
      }
    });

    this.transactionService.getJournalAccountPaymentCash().pipe(
      switchMap((journalRes: any) => {
        const journalAccount = (journalRes && journalRes.length > 0) ? journalRes[0] : null;
        const isOwing = this.uangDiterima() === 0;
        const payload: any = {
          DocDate: this.docDate(),
          DocDueDate: this.dueDate(),
          DeliveryDate: this.deliveryDate(),
          Remarks: this.remarks(),
          DocTotal: total, DocDueTotal: total, DocDiscAmount: 0,
          isGeneratePayment: !isOwing,
          isLocked: false,
          CashPayment: this.uangDiterima(),
          CustomerModel: { Code: this.customerCode() },
          Details: items.map((i, index) => ({
            LineNo: index + 1, isScanned: true, isScan: 1,
            Quantity: i.qty, OpenQuantity: i.qty, QuantityScanned: i.qty, BaseQuantity: i.qty * i.conversion,
            Price: i.price, LineTotal: i.subtotal,
            ProductModel: { Code: i.id },
            UoMModel: { Code: i.uomCode },
            WarehouseModel: { Code: this.productService.branchCode() || '06' },
            BasedSalesOrderDetailModel: i.basedSalesOrderDetailId ? {
              Id: i.basedSalesOrderDetailId,
              OpenQuantity: i.qty, Quantity: i.qty, BaseQuantity: i.qty * i.conversion,
              QuantityScanned: i.qty, Price: i.price, LineTotal: i.subtotal
            } : null
          }))
        };

        if (!isOwing) {
          payload.CashModel = {
            PaymentTotal: total,
            GLAccount: journalAccount?.AccountCode || ''
          };
        }

        if (mode === 'checkout') {
          payload.SalesPickingModel = {
            BoxUsed: 0,
            PickingStatus: 'Checkout',
            Pickers: '-',
            PickersName: '-'
          };
        }

        return this.transactionService.postSalesInvoice(payload);
      }),
      switchMap((res: any) => {
        const docNum = typeof res === 'string' ? res : (res?.DocNum || '');
        if (!docNum) throw new Error('Gagal mendapatkan nomor dokumen.');

        return this.transactionService.finishPicking(docNum, hasTambahan).pipe(
          switchMap(() => this.transactionService.getPickingQueue(docNum)),
          switchMap((queueRes: any) => {
            const queueDetails = queueRes?.Details || [];
            const matchedDetails: any[] = [];
            for (const [code, count] of Object.entries(readyCounts)) {
              const detailsForCode = queueDetails.filter((d: any) => d.ProductModel?.Code === code);
              detailsForCode.slice(0, count).forEach((d: any) => matchedDetails.push(d));
            }
            if (matchedDetails.length > 0) {
              const putPayload = {
                PIC: [this.authService.userName() || 'KASIR'],
                DetailId: matchedDetails.map((d: any) => d.Id),
                DocNum: docNum
              };
              return this.transactionService.putPickingQueue(putPayload).pipe(switchMap(() => of(docNum)));
            } else return of(docNum);
          })
        );
      })
    ).subscribe({
      next: (docNum: any) => {
        Swal.close();

        Swal.fire({
          title: 'Transaksi Berhasil',
          text: 'No Doc: ' + docNum,
          icon: 'success',
          showDenyButton: true,
          confirmButtonText: 'OK',
          denyButtonText: 'Cetak Bon',
          customClass: { denyButton: 'swal2-btn-success' },
        }).then((result) => {
          if (result.isDenied) {
            Swal.fire({
              title: 'Memproses data struk...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            this.transactionService.getSalesInvoicePrint(docNum).subscribe({
              next: (bonDetails: any[]) => {
                Swal.close();
                this.receiptPrintService.printReceipt(bonDetails);
                this.resetTransaksi();
              },
              error: (err) => {
                Swal.close();
                console.error('Error fetching print receipt details:', err);

                // Struk tetap tercetak dari data lokal bila endpoint print gagal.
                const mockDetails = this.cartItemsFromInput().map(i => ({
                  productName: i.name,
                  quantity: i.qty,
                  uoM: i.uomCode || i.uom,
                  price: i.price,
                  lineTotal: i.subtotal,
                  baseQuantity: i.conversion,
                  remarks: this.remarks(),
                  docNum: docNum,
                  docDate: new Date().toISOString(),
                  customerName: this.customerData()?.name || this.customerData()?.Name || this.customerData()?.CustomerName || this.customerCode() || 'PELANGGAN',
                  cashier: this.authService.userName() || 'KASIR',
                  cashPayment: this.uangDiterima(),
                  docTotal: this.totalBayar(),
                  point: this.customerPoints(),
                  pointReward: this.customerData()?.overallPointReward || 0
                }));
                this.receiptPrintService.printReceipt(mockDetails);
                this.resetTransaksi();
              }
            });
          } else {
            this.resetTransaksi();
          }
        });
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire('Error', err.error?.message || err.message || 'Gagal menyimpan transaksi', 'error');
      }
    });
  }

  async requestBypass() {
    const scheme = this.activeApprovalScheme();
    if (!scheme) {
      const { isConfirmed } = await Swal.fire({
        title: 'Bypass semua validasi?',
        text: 'Tindakan ini akan mengizinkan transaksi kredit meskipun melanggar aturan bisnis.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Bypass',
        cancelButtonText: 'Batal'
      });
      if (isConfirmed) this.isCreditBypassed.set(true);
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Bypass semua validasi?',
      text: `Meminta persetujuan untuk skema: ${scheme}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Minta Persetujuan',
      cancelButtonText: 'Batal'
    });

    if (isConfirmed) {
      Swal.fire({
        title: 'Memproses Persetujuan...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.transactionService.getApprovalScheme(scheme).subscribe({
        next: () => {
          this.isCreditBypassed.set(true);
          Swal.fire('Berhasil', 'Validasi telah dibypass.', 'success');
        },
        error: (err) => {
          console.error('Bypass Error:', err);
          Swal.fire('Gagal', 'Persetujuan ditolak atau terjadi kesalahan server.', 'error');
        }
      });
    }
  }

  async requestNonRokokBypass() {
    const stats = this.nonRokokStats();
    const { isConfirmed } = await Swal.fire({
      title: 'Bypass Persentase Non-Rokok?',
      text: `Meminta persetujuan Salesman untuk persentase ${stats.current.toFixed(2)}% (Min: ${stats.required}%).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Minta Persetujuan',
      cancelButtonText: 'Batal'
    });

    if (isConfirmed) {
      Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      this.transactionService.getApprovalScheme('SALESMAN_NON_ROKOK_PERCENTAGE').subscribe({
        next: () => {
          this.isNonRokokBypassed.set(true);
          Swal.fire('Berhasil', 'Persetujuan Non-Rokok diterima.', 'success');
        },
        error: (err) => {
          console.error('Bypass Error:', err);
          Swal.fire('Gagal', 'Persetujuan ditolak.', 'error');
        }
      });
    }
  }

  /** Simpan keranjang sebagai Sales Order (transaksi tertunda). */
  async executeTunda() {
    if (!this.customerCode()) {
      Swal.fire('Peringatan', 'Silakan pilih pelanggan terlebih dahulu.', 'warning');
      return;
    }

    const items = this.cartItemsFromInput();
    if (items.length === 0) {
      Swal.fire('Peringatan', 'Keranjang belanja masih kosong.', 'warning');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Tunda Transaksi?',
      text: 'Apakah Anda yakin ingin menunda transaksi ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tunda',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#f59e0b'
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: 'Menunda Transaksi...', allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const total = this.totalBayar();

    this.transactionService.getJournalAccountPaymentCash().pipe(
      switchMap((journalRes: any) => {
        const journalAccount = (journalRes && journalRes.length > 0) ? journalRes[0] : null;
        const isOwing = this.uangDiterima() === 0;
        const payload: any = {
          DocDate: this.docDate(),
          DocDueDate: this.dueDate(),
          DeliveryDate: this.deliveryDate(),
          Remarks: this.remarks(),
          DocTotal: total, DocDueTotal: total, DocDiscAmount: 0,
          isGeneratePayment: !isOwing,
          isLocked: false,
          CashPayment: this.uangDiterima(),
          CustomerModel: { Code: this.customerCode() },
          Details: items.map((i, index) => ({
            LineNo: index + 1, isScanned: true, isScan: 1,
            Quantity: i.qty, OpenQuantity: i.qty, QuantityScanned: i.qty, BaseQuantity: i.qty * i.conversion,
            Price: i.price, LineTotal: i.subtotal,
            ProductModel: { Code: i.id },
            UoMModel: { Code: i.uomCode },
            WarehouseModel: { Code: this.productService.branchCode() || '06' },
            BasedSalesOrderDetailModel: i.basedSalesOrderDetailId ? {
              Id: i.basedSalesOrderDetailId,
              OpenQuantity: i.qty, Quantity: i.qty, BaseQuantity: i.qty * i.conversion,
              QuantityScanned: i.qty, Price: i.price, LineTotal: i.subtotal
            } : null
          }))
        };

        if (!isOwing) {
          payload.CashModel = {
            PaymentTotal: total,
            GLAccount: journalAccount?.AccountCode || ''
          };
        }

        return this.transactionService.postSalesOrder(payload);
      })
    ).subscribe({
      next: (res: any) => {
        Swal.close();
        const docNum = typeof res === 'string' ? res : (res?.DocNum || res?.docNum || '');
        Swal.fire({
          title: 'Transaksi Ditunda',
          text: docNum ? 'No Document: ' + docNum : 'Transaksi berhasil ditunda',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.resetTransaksi();
        });
      },
      error: (err: any) => {
        Swal.close();
        Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal menunda transaksi', 'error');
      }
    });
  }

  /**
   * Muat kembali transaksi tertunda ke keranjang. Produk yang tidak ada di
   * master lokal direkonstruksi dari detail dokumen agar barisnya tetap muncul.
   */
  loadSalesOrder(docNum: string) {
    Swal.fire({
      title: 'Memuat Transaksi Tundaan...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.transactionService.getSalesOrder(docNum).subscribe({
      next: (order: any) => {
        Swal.close();
        if (!order) {
          Swal.fire('Error', 'Data tundaan tidak ditemukan.', 'error');
          return;
        }

        const currentUser = this.authService.userName() || 'KASIR';
        const lockedBy = order.LastUpdatedBy || order.lastUpdatedBy;
        if (order.isLocked && lockedBy && lockedBy !== currentUser) {
          Swal.fire({
            title: 'Transaksi Dikunci',
            text: `Dokumen #${docNum} sedang dikunci oleh "${lockedBy}". Pengguna lain tidak dapat mengaksesnya.`,
            icon: 'error'
          });
          this.router.navigate(['/admin/pos/held-transaction']);
          return;
        }

        this.resetTransaksi(false);
        this.loadedSalesOrder.set(order);

        const custCode = order.CustomerModel?.Code || order.customerCode || order.CustomerCode;
        if (custCode) {
          const custName = order.CustomerModel?.Name || order.CustomerModel?.CustomerName || order.customerName || custCode;
          this.selectCustomer({ code: custCode, name: custName });
        }

        const details = order.Details || order.details || [];
        if (details.length > 0) {
          details.forEach((det: any) => {
            const pCode = det.ProductModel?.Code || det.ProductModel?.code || det.ProductCode || det.productCode || det.Code || det.code;
            if (!pCode) return;

            let product = this.availableProducts().find((p: any) => p.id === pCode || p.code === pCode);

            if (!product && det.ProductModel) {
              product = this.productService.mapToProduct(det.ProductModel);
              if (product && product.id) {
                this.availableProducts.update(curr => [...curr, product!]);
              }
            }

            if (!product) {
              const pName = det.ProductModel?.Name || det.ProductName || det.Description || pCode;
              const uomCode = det.UoMModel?.Code || det.UoMCode || det.UoM || 'PCS';
              const price = det.Price || det.BasePrice || 0;
              const conv = (det.BaseQuantity && det.Quantity) ? (det.BaseQuantity / det.Quantity) : (det.baseQuantity && det.quantity) ? (det.baseQuantity / det.quantity) : 1;
              product = {
                id: pCode,
                name: pName,
                price: price,
                uom: uomCode,
                uomOptions: [uomCode],
                uomDetails: [{ name: uomCode, package: 0, conversion: conv }],
                category: 'Lainnya',
                image: `https://placehold.co/400x400?text=${encodeURIComponent(pName)}`,
                description: '',
                isRokok: false
              };
              this.availableProducts.update(curr => [...curr, product!]);
            }

            const uomCode = det.UoMModel?.Code || det.UoMModel?.code || det.UoMCode || det.UoM || det.uomCode || '';
            const matchedUom = product.uomOptions.find((u: string) => u.toLowerCase() === uomCode.toLowerCase());
            const finalUom: string = matchedUom || uomCode || product.uom || product.uomOptions[0] || 'PCS';

            if (!product.uomOptions.includes(finalUom)) {
              product.uomOptions.push(finalUom);
            }
            if (!product.uomDetails.some(d => d.name === finalUom)) {
              const conv = (det.BaseQuantity && det.Quantity) ? (det.BaseQuantity / det.Quantity) : 1;
              product.uomDetails.push({ name: finalUom, package: 0, conversion: conv });
            }

            const salesOrderDetailId = det.Id || det.id || undefined;
            const qty = det.Quantity || det.OpenQuantity || det.QuantityScanned || det.baseQuantity || 1;
            const rowId = `row-${++this.rowCounter}`;

            this.activeRows.update(current => [...current, { rowId, productId: product!.id, basedSalesOrderDetailId: salesOrderDetailId }]);
            this.inputState.update(prev => ({
              ...prev,
              [rowId]: {
                ...(prev[rowId] || {}),
                [finalUom]: qty
              }
            }));
            this.itemReadyState.update(prev => ({ ...prev, [rowId]: false }));

            const itemPrice = det.Price || det.price || product!.price || 0;
            if (itemPrice > 0) {
              this.unitPrices.update(prev => ({
                ...prev,
                [product!.id]: {
                  ...(prev[product!.id] || {}),
                  [finalUom]: itemPrice
                }
              }));
            }
          });

          Swal.fire({
            title: 'Tundaan Dimuat',
            text: `Dokumen #${docNum} berhasil dimuat ke keranjang.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (err: any) => {
        Swal.close();
        Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal memuat tundaan.', 'error');
      }
    });
  }

  /** Menunda ulang transaksi yang sedang dibuka: terbit SO baru menggantikan lama. */
  async tundaLagi() {
    const oldOrder = this.loadedSalesOrder();
    if (!oldOrder) return;

    if (!this.customerCode()) {
      Swal.fire('Peringatan', 'Silakan pilih pelanggan terlebih dahulu.', 'warning');
      return;
    }

    const items = this.cartItemsFromInput();
    if (items.length === 0) {
      Swal.fire('Peringatan', 'Keranjang belanja masih kosong.', 'warning');
      return;
    }

    const docNum = oldOrder.DocNum || oldOrder.docNum || '';
    const { isConfirmed } = await Swal.fire({
      title: 'Tunda Lagi Transaksi?',
      text: docNum
        ? `Transaksi tundaan #${docNum} akan dibatalkan dan digantikan dengan transaksi tunda baru. Lanjutkan?`
        : 'Transaksi tundaan sebelumnya akan dibatalkan dan digantikan dengan transaksi tunda baru. Lanjutkan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tunda Lagi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#f59e0b'
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: 'Memproses Tunda Lagi...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const total = this.totalBayar();

    this.transactionService.getJournalAccountPaymentCash().pipe(
      switchMap((journalRes: any) => {
        const journalAccount = (journalRes && journalRes.length > 0) ? journalRes[0] : null;
        const isOwing = this.uangDiterima() === 0;
        const payload: any = {
          DocDate: this.docDate(),
          DocDueDate: this.dueDate(),
          DeliveryDate: this.deliveryDate(),
          Remarks: this.remarks(),
          DocTotal: total, DocDueTotal: total, DocDiscAmount: 0,
          isGeneratePayment: !isOwing,
          isLocked: false,
          CashPayment: this.uangDiterima(),
          CustomerModel: { Code: this.customerCode() },
          Details: items.map((i, index) => ({
            LineNo: index + 1, isScanned: true, isScan: 1,
            Quantity: i.qty, OpenQuantity: i.qty, QuantityScanned: i.qty, BaseQuantity: i.qty * i.conversion,
            Price: i.price, LineTotal: i.subtotal,
            ProductModel: { Code: i.id },
            UoMModel: { Code: i.uomCode },
            WarehouseModel: { Code: this.productService.branchCode() || '06' },
            BasedSalesOrderDetailModel: i.basedSalesOrderDetailId ? {
              Id: i.basedSalesOrderDetailId,
              OpenQuantity: i.qty, Quantity: i.qty, BaseQuantity: i.qty * i.conversion,
              QuantityScanned: i.qty, Price: i.price, LineTotal: i.subtotal
            } : null
          }))
        };

        if (!isOwing) {
          payload.CashModel = {
            PaymentTotal: total,
            GLAccount: journalAccount?.AccountCode || ''
          };
        }

        return this.transactionService.postSalesOrder(payload);
      })
    ).subscribe({
      next: (res: any) => {
        Swal.close();
        const newDocNum = typeof res === 'string' ? res : (res?.DocNum || res?.docNum || '');
        this.loadedSalesOrder.set(null);
        Swal.fire({
          title: 'Transaksi Ditunda Kembali',
          text: newDocNum ? 'No Document Baru: ' + newDocNum : 'Transaksi tunda baru berhasil dibuat.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.resetTransaksi();
        });
      },
      error: (err: any) => {
        Swal.close();
        console.error('Error tundaLagi:', err);
        Swal.fire('Gagal', err?.error?.message || err?.message || 'Gagal memproses Tunda Lagi transaksi.', 'error');
      }
    });
  }
}
