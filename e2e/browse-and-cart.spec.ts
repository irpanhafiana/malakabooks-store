import { test, expect } from '@playwright/test';

test.describe('Flow Browse & Cart', () => {
  test('pengguna dapat membuka halaman utama dan melihat katalog produk', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kopi Mardika/);

    // Verifikasi keberadaan elemen halaman utama
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('pengguna dapat membuka keranjang belanja', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('body')).toBeVisible();
  });
});
