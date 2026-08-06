import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

type JokulCheckoutFn = (url: string) => void;

/**
 * Memuat aset Jokul/DOKU checkout secara lazy lalu membuka popup pembayaran.
 *
 * Sebelumnya script + stylesheet dimuat dari index.html pada setiap page load
 * (cross-origin, render-blocking, dan selalu menunjuk sandbox). Sekarang URL-nya
 * berasal dari environment dan hanya diunduh saat pengguna benar-benar memilih
 * metode pembayaran DOKU.
 *
 * PENTING: `open()` mengembalikan boolean, bukan melempar. Pada titik pemanggilan,
 * order SUDAH tercatat di backend — jadi kegagalan memuat gateway tidak boleh
 * membuat alur berhenti diam-diam; pemanggil wajib punya jalur fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class DokuCheckoutService {
  private readonly logger = inject(LoggerService);
  private loadPromise?: Promise<void>;

  /**
   * @returns `true` bila popup checkout berhasil dibuka, `false` bila aset gagal
   *          dimuat atau `loadJokulCheckout` tidak tersedia.
   */
  async open(checkoutUrl: string): Promise<boolean> {
    try {
      await this.ensureAssetsLoaded();
    } catch (err) {
      this.logger.error('DokuCheckoutService: gagal memuat aset checkout', err);
      return false;
    }

    const loadJokulCheckout = (window as unknown as { loadJokulCheckout?: JokulCheckoutFn }).loadJokulCheckout;
    if (typeof loadJokulCheckout !== 'function') {
      this.logger.error('DokuCheckoutService: loadJokulCheckout tidak tersedia setelah script dimuat');
      return false;
    }

    loadJokulCheckout(checkoutUrl);
    return true;
  }

  private ensureAssetsLoaded(): Promise<void> {
    if (typeof (window as unknown as { loadJokulCheckout?: JokulCheckoutFn }).loadJokulCheckout === 'function') {
      return Promise.resolve();
    }

    // Cache promise-nya agar percobaan checkout berulang tidak menyuntik script ganda.
    this.loadPromise ??= new Promise<void>((resolve, reject) => {
      if (environment.dokuStyleUrl && !document.querySelector(`link[href="${environment.dokuStyleUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = environment.dokuStyleUrl;
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = environment.dokuScriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Buang cache agar percobaan berikutnya memuat ulang, bukan memakai promise gagal.
        this.loadPromise = undefined;
        script.remove();
        reject(new Error(`Gagal memuat ${environment.dokuScriptUrl}`));
      };
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }
}
