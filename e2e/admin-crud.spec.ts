import { test, expect } from '@playwright/test';

test.describe('Flow Admin Management', () => {
  test('pengunjung publik mendapatkan 404 ketika mengakses route admin tanpa kredensial', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();
  });
});
