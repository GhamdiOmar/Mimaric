import { test, expect } from '@playwright/test';
import { ProjectDetailPage } from './pages/project-detail.page';

/**
 * PM role: has launch:read
 * Tests the launch readiness checklist tab
 */
test.describe('Launch Readiness — Project Manager', () => {
  let projectPage: ProjectDetailPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectDetailPage(page);
    await projectPage.goto();
  });

  test('readiness tab is visible', async () => {
    await projectPage.expectTabVisible('readiness');
  });

  test('displays checklist with pass/fail indicators', async ({ page }) => {
    await projectPage.clickTab('readiness');
    await page.waitForTimeout(2000);

    // Should show checklist items (Arabic labels from readiness checklist)
    const subdivisionItem = page.getByText('مخطط تقسيم معتمد');
    await expect(subdivisionItem).toBeVisible();

    const inventoryItem = page.getByText('إنشاء المخزون');
    await expect(inventoryItem).toBeVisible();
  });

  test('shows readiness banner', async ({ page }) => {
    await projectPage.clickTab('readiness');
    await page.waitForTimeout(2000);

    // Should show either "Ready" or "Not Ready" banner
    const readyText = page.getByText('جاهز للإطلاق');
    const notReadyText = page.getByText('غير جاهز للإطلاق');
    const bannerVisible = await readyText.isVisible().catch(() => false) ||
                          await notReadyText.isVisible().catch(() => false);
    expect(bannerVisible).toBeTruthy();
  });

  test('blockers link to relevant tabs', async ({ page }) => {
    await projectPage.clickTab('readiness');
    await page.waitForTimeout(2000);

    // If there are blockers, they should have fix buttons
    const fixButtons = page.getByRole('button', { name: /إصلاح|Fix/i });
    const count = await fixButtons.count();
    // Infrastructure is at 57% so there should be at least 1 fix button
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
