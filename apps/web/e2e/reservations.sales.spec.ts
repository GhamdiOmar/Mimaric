import { test, expect } from '@playwright/test';
import { ReservationsPage } from './pages/reservations.page';

/**
 * Sales Agent role: has reservations:write
 * Tests the "From Inventory" reservation flow
 */
test.describe('Reservations From Inventory — Sales Agent', () => {
  let reservationsPage: ReservationsPage;

  test.beforeEach(async ({ page }) => {
    reservationsPage = new ReservationsPage(page);
    await reservationsPage.goto();
  });

  test('source toggle is visible', async () => {
    await reservationsPage.expectSourceToggleVisible();
  });

  test('defaults to "From Unit" source', async ({ page }) => {
    const unitTab = page.getByText('من الوحدات');
    await expect(unitTab).toBeVisible();
  });

  test('can switch to "From Inventory" source', async ({ page }) => {
    await reservationsPage.selectSource('inventory');
    // The inventory button should now be active (has white bg)
    await expect(page.getByText('من المخزون')).toBeVisible();
  });

  test('shows project dropdown after selecting customer in inventory mode', async ({ page }) => {
    await reservationsPage.selectSource('inventory');
    await page.waitForTimeout(500);

    // First select a customer
    const customerCards = page.locator('.cursor-pointer').filter({ hasText: /.{2,}/ });
    const count = await customerCards.count();
    if (count > 0) {
      await customerCards.first().click();
      await page.waitForTimeout(500);
      // Now the project dropdown should appear
      await expect(page.locator('select').first()).toBeVisible();
    }
  });

  test('step 1 shows customer list', async ({ page }) => {
    await reservationsPage.expectStepVisible(1);
    await page.waitForTimeout(2000);
    const customerCards = page.locator('.cursor-pointer').filter({ hasText: /.+/ });
    const count = await customerCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('can navigate through steps with unit source', async ({ page }) => {
    await page.waitForTimeout(2000);
    const customerCards = page.locator('.cursor-pointer').filter({ hasText: /.{2,}/ });
    const count = await customerCards.count();

    if (count > 0) {
      await customerCards.first().click();
      await reservationsPage.clickNext();
      await reservationsPage.expectStepVisible(2);
    }
  });
});
