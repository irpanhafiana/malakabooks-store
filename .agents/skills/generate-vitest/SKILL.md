---
name: generate-vitest
description: Otomatisasi pembuatan Unit Test menggunakan standar Angular 21 dan Vitest.
---

# Instruksi Skill: generate-vitest

Saat pengguna meminta Anda (AI) untuk membuatkan *unit test* atau menguji sebuah komponen/service, Anda WAJIB mengikuti prosedur berikut secara ketat:

## 1. Lokasi dan Penamaan
- Selalu buat file pengujian dengan akhiran `.spec.ts` (contoh: `button.component.spec.ts`).
- Letakkan file tersebut di dalam direktori yang sama persis dengan komponen atau service yang sedang diuji.

## 2. Standar Framework (Vitest)
- Proyek ini menggunakan **Vitest** dan **jsdom**, BUKAN Jasmine atau Karma.
- Anda wajib mengimpor `describe`, `it`, `expect`, `beforeEach`, dan `vi` secara langsung dari `'vitest'`.
- Jangan menggunakan `spyOn` dari Jasmine, melainkan gunakan `vi.fn()` atau `vi.spyOn()`.

## 3. Pendekatan Pengujian Angular 21 (Standalone & Signals)
Karena proyek ini berjalan di atas Angular 21 (murni Standalone Components + Signals):
- **Setup Dasar**: Gunakan `TestBed.configureTestingModule` atau `TestBed.createComponent` tanpa mendeklarasikan `NgModules`.
- **Pengujian Input Signals**: Untuk memasukkan nilai ke Angular Signals (`input()` API), jangan pernah menggunakan penugasan langsung (`component.myInput = value`). Anda WAJIB menggunakan metode Angular terbaru: `fixture.componentRef.setInput('myInput', value)`.
- **Change Detection**: Selalu panggil `fixture.detectChanges()` setelah mengubah nilai input atau melakukan interaksi DOM.

## 4. Struktur Uji Wajib (Minimum Test Cases)
Setiap file komponen yang diuji minimal harus memiliki blok pengujian berikut:
1. `it('should create', ...)`: Memastikan instansiasi *class* komponen/service tidak *error*.
2. Pengujian DOM (Tampilan): Memverifikasi apakah nilai bawaan (*default value*) dirender dengan benar.
3. Pengujian Interaksi / Emit Event: Menguji apa yang terjadi jika elemen (seperti tombol) diklik.

## 5. Mocking / Ketergantungan Eksternal
- DILARANG memanggil API sungguhan.
- Jika komponen bergantung pada Service (`HttpClient` atau State/Store), sediakan *mock provider* menggunakan `useValue` dengan fungsi `vi.fn()` sebagai *placeholder*.
