import { test, expect } from '@playwright/test';

test('has title and login form rendered', async ({ page }) => {
  await page.goto('/auth/login');

  // Verify the page title
  const heading = await page.getByRole('heading', { level: 2 });
  await expect(heading).toContainText(/(Sign In|تسجيل الدخول)/i);

  // Verify the form elements are present
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Login/i }).or(page.getByRole('button', { name: /تسجيل الدخول/i }))).toBeVisible();
});
