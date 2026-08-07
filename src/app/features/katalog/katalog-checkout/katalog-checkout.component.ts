import { Component, ElementRef, viewChild, inject, AfterViewInit, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { KatalogCartStore } from '../../../store/katalog-cart.store';
import { B2cOrderStore } from '../../../store/b2c-order.store';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-katalog-checkout',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './katalog-checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KatalogCheckoutComponent implements AfterViewInit {
  qrcodeCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrcodeCanvas');
  cartStore = inject(KatalogCartStore);
  b2cOrderStore = inject(B2cOrderStore);
  private router = inject(Router);

  // Payment confirmation state
  isPaymentConfirm = signal<boolean>(false);
  isPaymentVisible = signal<boolean>(false);
  isGeneratingQr = signal<boolean>(false);

  constructor() {
    effect(() => {
      const id = this.b2cOrderStore.lastOrderId();
      const canvas = this.qrcodeCanvas();
      if (id && canvas) {
        this.generateQRCode();
      }
    });
  }

  ngAfterViewInit() {
    this.generateQRCode();
  }

  requestPaymentConfirm() {
    this.isPaymentConfirm.set(true);
    setTimeout(() => this.isPaymentVisible.set(true), 10);
  }

  cancelPaymentConfirm() {
    this.isPaymentVisible.set(false);
    setTimeout(() => this.isPaymentConfirm.set(false), 300);
  }

  confirmPayment() {
    this.isPaymentVisible.set(false);
    setTimeout(() => {
      this.isPaymentConfirm.set(false);
      this.cartStore.clearCart();
      this.b2cOrderStore.setLastOrderId(null);
      this.router.navigate(['/katalog']);
    }, 300);
  }

  async generateQRCode() {
    const qrData = this.b2cOrderStore.lastOrderId();
    const canvas = this.qrcodeCanvas();
    
    if (!qrData || !canvas) return;

    this.isGeneratingQr.set(true);
    try {
      await QRCode.toCanvas(canvas.nativeElement, qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Error generating QR Code:', err);
    } finally {
      this.isGeneratingQr.set(false);
    }
  }
}
