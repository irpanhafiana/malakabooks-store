import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
      <div class="max-w-md w-full text-center space-y-6">
        <!-- Visual Illustration/Icon Container -->
        <div class="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary-50 text-primary-600 shadow-inner">
          <i class="bx bx-ghost text-6xl animate-bounce"></i>
          <span class="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-600 text-white text-xs font-bold shadow">
            404
          </span>
        </div>

        <!-- Heading & Message -->
        <div class="space-y-2">
          <h1 class="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
            Halaman Tidak Ditemukan
          </h1>
          <p class="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Maaf, halaman yang Anda cari tidak tersedia, telah dihapus, atau alamat URL yang dimasukkan salah.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            routerLink="/"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all shadow-md shadow-primary-600/20 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <i class="bx bx-home text-lg"></i>
            Kembali ke Beranda
          </a>
          <a
            routerLink="/product"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <i class="bx bx-store-alt text-lg"></i>
            Jelajahi Produk
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
