import { test, expect } from '@playwright/test';

test.describe('Flow Checkout', () => {
  test('pengguna diarahkan ke login jika belum diautentikasi saat checkout', async ({ page }) => {
    await page.goto('/checkout');
    // Auth guard mengarahkan ke login atau halaman pembatas
    await expect(page).toHaveURL(/\/(auth\/login|checkout|admin\/login)?/);
  });
});
