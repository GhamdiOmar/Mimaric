import { test, expect } from '@playwright/test';
import { ProjectDetailPage } from './pages/project-detail.page';

/**
 * PM role: has pricing:read + launch:read
 * Tests the analytics tab
 */
test.describe('Analytics Tab — Project Manager', () => {
  let projectPage: ProjectDetailPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectDetailPage(page);
    await projectPage.goto();
  });

  test('analytics tab is visible', async () => {
    await projectPage.expectTabVisible('analytics');
  });

  test('renders KPI summary cards', async ({ page }) => {
    await projectPage.clickTab('analytics');
    await page.waitForTimeout(2000);

    // Should display analytics KPI cards
    await expect(page.getByText('إجمالي القيمة').first()).toBeVisible();
    await expect(page.getByText('عناصر المخزون').first()).toBeVisible();
  });

  test('wave performance data loads', async ({ page }) => {
    await projectPage.clickTab('analytics');
    await page.waitForTimeout(2000);

    // Should show wave performance heading and table
    await expect(page.getByText('أداء الموجات')).toBeVisible();
  });

  test('pricing analysis data loads', async ({ page }) => {
    await projectPage.clickTab('analytics');
    await page.waitForTimeout(2000);

    // Should show pricing by type heading and table
    await expect(page.getByText('التسعير حسب النوع')).toBeVisible();
  });
});
