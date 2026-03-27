import { test, expect } from '@playwright/test';

test('verify charts', async ({ page }) => {
  await page.goto('http://localhost:3000/charts', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/home/jules/verification/charts_fixed.png', fullPage: true });
});
