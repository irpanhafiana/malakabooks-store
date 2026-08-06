import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { ProductApiService } from '../../../../core/services/product-api.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CustomerService, Customer } from '../../../../core/services/customer.service';
import { ReceiptPrintService } from '../../../../core/services/receipt-print.service';

export interface PosCartItem {
  id: string;
  code: string;
  name: string;
  price: number;
  uom: string;
  quantity: number;
  uomOptions: string[];
  barcode?: string;
  image?: string;
  lineTotal: number;
}

@Component({
  selector: 'app-pos-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css'
})
export class TransactionFormComponent implements OnInit {
  private productService = inject(ProductApiService);
  private transactionService = inject(TransactionService);
  private customerService = inject(CustomerService);
  private receiptPrintService = inject(ReceiptPrintService);
  private route = inject(ActivatedRoute);

  // --- State Signals ---
  searchQuery = signal<string>('');
  searchResults = signal<any[]>([]);
  isSearching = signal<boolean>(false);

  cartItems = signal<PosCartItem[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  customerSearchQuery = signal<string>('');
  customerSearchResults = signal<Customer[]>([]);
  isCustomerSearching = signal<boolean>(false);

  // Payment State
  isPaymentModalOpen = signal<boolean>(false);
  isQrScanModalOpen = signal<boolean>(false);

  uangDiterima = signal<number>(0);
  paymentMethod = signal<string>('CASH');
  remarks = signal<string>('');
  isProcessingPayment = signal<boolean>(false);
  loadedDocNum = signal<string | null>(null);

  // Computed Totals
  totalItemsCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
  subtotal = computed(() => this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0));
  totalBayar = computed(() => this.subtotal());
  kembalian = computed(() => Math.max(0, this.uangDiterima() - this.totalBayar()));
  canProcessPayment = computed(() => this.cartItems().length > 0 && this.uangDiterima() >= this.totalBayar());

  ngOnInit(): void {
    // Check if query param docNum exists
    this.route.queryParams.subscribe(params => {
      const docNum = params['docNum'];
      if (docNum) {
        this.loadDraftOrder(docNum);
      }
    });

    // Default Customer setup
    this.fetchDefaultCustomer();
  }

  // --- Keyboard Shortcuts for Fast POS Scanning ---
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      this.openPaymentModal();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.openQrScanModal();
    }
  }

  fetchDefaultCustomer() {
    this.customerService.getAutoFillCustomers(1, 10).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.selectedCustomer.set(res[0]);
        }
      },
      error: () => {
        this.selectedCustomer.set({ code: 'CUST-GENERAL', name: 'Pelanggan Umum' });
      }
    });
  }

  // --- Product Search & Addition ---
  async onProductSearchChange(query: string) {
    this.searchQuery.set(query);
    if (!query.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    try {
      const products = await this.productService.getProducts();
      const q = query.toLowerCase();
      const filtered = (products || []).filter(p => 
        (p.title || '').toLowerCase().includes(q) ||
        (p.isbn || '').toLowerCase().includes(q) ||
        (p.sapCode || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q)
      );
      this.searchResults.set(filtered);
    } catch {
      this.searchResults.set([]);
    } finally {
      this.isSearching.set(false);
    }
  }

  addToCart(product: any, quantity: number = 1) {
    const code = product.code || product.id || product.Code || '';
    const name = product.name || product.title || product.Name || 'Buku / Produk';
    const price = product.price || product.lowestPrice || product.priceSell || 0;
    const uom = product.uom || 'PCS';

    const current = this.cartItems();
    const existingIndex = current.findIndex(i => i.code === code && i.uom === uom);

    if (existingIndex > -1) {
      const updated = [...current];
      const newQty = updated[existingIndex].quantity + quantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        lineTotal: newQty * updated[existingIndex].price
      };
      this.cartItems.set(updated);
    } else {
      const newItem: PosCartItem = {
        id: code,
        code,
        name,
        price,
        uom,
        quantity,
        uomOptions: [uom],
        barcode: product.barcode || '',
        image: product.coverImage || product.image || 'https://placehold.co/100x100?text=Buku',
        lineTotal: price * quantity
      };
      this.cartItems.set([...current, newItem]);
    }

    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  updateQuantity(index: number, delta: number) {
    const current = [...this.cartItems()];
    if (index < 0 || index >= current.length) return;

    const newQty = current[index].quantity + delta;
    if (newQty <= 0) {
      this.removeCartItem(index);
      return;
    }

    current[index] = {
      ...current[index],
      quantity: newQty,
      lineTotal: newQty * current[index].price
    };
    this.cartItems.set(current);
  }

  removeCartItem(index: number) {
    const current = this.cartItems().filter((_, i) => i !== index);
    this.cartItems.set(current);
  }

  clearCart() {
    this.cartItems.set([]);
    this.loadedDocNum.set(null);
    this.uangDiterima.set(0);
    this.remarks.set('');
  }

  // --- Customer Selection ---
  onCustomerSearchChange(query: string) {
    this.customerSearchQuery.set(query);
    if (!query.trim()) {
      this.customerSearchResults.set([]);
      return;
    }

    this.isCustomerSearching.set(true);
    this.customerService.getAutoFillCustomers(1, 20).subscribe({
      next: (res) => {
        this.isCustomerSearching.set(false);
        const filtered = (res || []).filter(c => 
          (c.name || c.Name || '').toLowerCase().includes(query.toLowerCase()) ||
          (c.code || c.Code || '').toLowerCase().includes(query.toLowerCase())
        );
        this.customerSearchResults.set(filtered);
      },
      error: () => {
        this.isCustomerSearching.set(false);
        this.customerSearchResults.set([]);
      }
    });
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.customerSearchQuery.set('');
    this.customerSearchResults.set([]);
  }

  // --- Draft Order Loader (From QR Scan) ---
  loadDraftOrder(docNum: string) {
    Swal.fire({
      title: 'Memuat Draft Order...',
      text: `Nomor Ref: ${docNum}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.transactionService.getSalesOrder(docNum).subscribe({
      next: (order: any) => {
        Swal.close();
        if (!order) {
          Swal.fire('Gagal', 'Data draft order tidak ditemukan.', 'error');
          return;
        }

        this.loadedDocNum.set(docNum);

        // Populate customer
        if (order.CustomerModel || order.customerName) {
          this.selectedCustomer.set({
            code: order.CustomerCode || order.customerCode || 'CUST-GENERAL',
            name: order.CustomerModel?.Name || order.customerName || 'Pelanggan Offline'
          });
        }

        // Populate items
        const items = order.items || order.lines || order.SalesOrderDetails || [];
        const mappedItems: PosCartItem[] = items.map((it: any) => ({
          id: it.productCode || it.itemCode || it.code || 'ITEM',
          code: it.productCode || it.itemCode || it.code || 'ITEM',
          name: it.productName || it.itemName || it.description || 'Buku / Produk',
          price: it.price || it.unitPrice || 0,
          uom: it.uom || it.uoM || 'PCS',
          quantity: it.quantity || it.qty || 1,
          uomOptions: [it.uom || 'PCS'],
          lineTotal: (it.price || 0) * (it.quantity || 1)
        }));

        this.cartItems.set(mappedItems);
        Swal.fire({
          title: 'Draft Order Dimuat',
          text: `Pesanan #${docNum} berhasil dimuat ke keranjang.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.close();
        Swal.fire('Gagal', err?.error?.message || 'Gagal memuat draft order.', 'error');
      }
    });
  }

  // --- QR Import Scanner ---
  openQrScanModal() {
    this.isQrScanModalOpen.set(true);
  }

  closeQrScanModal() {
    this.isQrScanModalOpen.set(false);
  }

  processImportQrString(qrString: string) {
    if (!qrString.trim()) return;

    let docNum = qrString.trim();
    if (docNum.includes(':')) {
      const parts = docNum.split(':');
      docNum = parts[1] || parts[0];
    }

    this.closeQrScanModal();
    this.loadDraftOrder(docNum);
  }

  // --- Payment Execution ---
  openPaymentModal() {
    if (this.cartItems().length === 0) {
      Swal.fire('Keranjang Kosong', 'Tambahkan minimal 1 produk ke keranjang.', 'warning');
      return;
    }
    this.uangDiterima.set(this.totalBayar());
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal() {
    this.isPaymentModalOpen.set(false);
  }

  setExactUang(amount: number) {
    this.uangDiterima.set(amount);
  }

  executePembayaran() {
    if (!this.canProcessPayment()) return;

    this.isProcessingPayment.set(true);

    const payload = {
      CustomerCode: this.selectedCustomer()?.code || 'CUST-GENERAL',
      CustomerName: this.selectedCustomer()?.name || 'Pelanggan Umum',
      DocTotal: this.totalBayar(),
      CashPayment: this.uangDiterima(),
      ChangeAmount: this.kembalian(),
      Remarks: this.remarks(),
      DocNum: this.loadedDocNum(),
      Items: this.cartItems().map(item => ({
        productCode: item.code,
        productName: item.name,
        uom: item.uom,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.lineTotal
      }))
    };

    this.transactionService.postSalesInvoice(payload).subscribe({
      next: (res: any) => {
        this.isProcessingPayment.set(false);
        this.closePaymentModal();

        const createdDocNum = res?.docNum || res?.DocNum || 'INV-' + Date.now();

        Swal.fire({
          title: 'Pembayaran Berhasil!',
          text: `Invoice #${createdDocNum} telah diterbitkan.`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Cetak Struk',
          cancelButtonText: 'Tutup',
          confirmButtonColor: '#FE7743'
        }).then((result) => {
          if (result.isConfirmed) {
            this.receiptPrintService.printReceipt([{
              docNum: createdDocNum,
              docDate: new Date().toISOString(),
              customerName: payload.CustomerName,
              cashier: 'Kasir Main',
              remarks: payload.Remarks,
              docTotal: payload.DocTotal,
              cashPayment: payload.CashPayment,
              items: payload.Items
            }]);
          }
          this.clearCart();
        });
      },
      error: (err: any) => {
        this.isProcessingPayment.set(false);
        Swal.fire('Gagal Pembayaran', err?.error?.message || 'Terjadi kesalahan saat memproses invoice.', 'error');
      }
    });
  }
}
