import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="text-center flex flex-col items-center gap-5">
      <div class="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
        <i class="bx bx-user-plus text-3xl text-primary-600"></i>
      </div>

      <div>
        <h2 class="text-xl font-display font-extrabold text-slate-800 tracking-tight mb-2">
          Daftar Akun Baru
        </h2>
        <p class="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
          Pendaftaran akun dikelola melalui portal admin MalakaBooks.
          Untuk mendapatkan akses, hubungi administrator Anda.
        </p>
      </div>

      <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left flex flex-col gap-3">
        <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Cara mendapatkan akun:</p>
        <ol class="text-xs text-slate-600 flex flex-col gap-2 list-decimal list-inside leading-relaxed">
          <li>Hubungi administrator MalakaBooks</li>
          <li>Berikan nama lengkap dan email Anda</li>
          <li>Admin akan membuat akun dan mengirimkan kredensial login</li>
        </ol>
      </div>

      <div class="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
        <p class="text-xs font-bold text-amber-700 mb-1">Demo tersedia:</p>
        <p class="text-xs text-amber-600">
          Username: <code class="bg-amber-100 px-1.5 py-0.5 rounded font-mono">customer&#64;malakabooks.local</code>
        </p>
        <p class="text-xs text-amber-600 mt-1">Password: <code class="bg-amber-100 px-1.5 py-0.5 rounded font-mono">ChangeMe123!</code></p>
      </div>

      <a
        routerLink="/auth/login"
        class="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors text-center block"
      >
        Masuk ke Akun Saya
      </a>

      <p class="text-[10px] text-slate-400">
        Sudah punya akun?
        <a routerLink="/auth/login" class="text-primary-600 font-semibold hover:underline">Sign in</a>
      </p>
    </div>
  `
})
export class RegisterComponent {}
