import { test, expect } from '@playwright/test';
import { ProjectDetailPage } from './pages/project-detail.page';

/**
 * Admin role (COMPANY_ADMIN): has pricing:write + launch:write
 * Also has infrastructure:write + inventory:write (superset)
 */
test.describe('Off-Plan Modals — Admin', () => {
  let projectPage: ProjectDetailPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectDetailPage(page);
    await projectPage.goto();
  });

  test('can open pricing rule modal', async ({ page }) => {
    await projectPage.clickTab('pricing');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة قاعدة|Add Rule/i);
    await projectPage.expectModalVisible();
  });

  test('can open launch wave modal', async ({ page }) => {
    await projectPage.clickTab('launch');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة موجة|Add Wave/i);
    await projectPage.expectModalVisible();
  });

  test('admin can see infrastructure Add button', async ({ page }) => {
    await projectPage.clickTab('infrastructure');
    await page.waitForTimeout(1000);
    await projectPage.expectAddButtonVisible(/إضافة فئة|Add Category/i);
  });

  test('admin can see inventory Add button', async ({ page }) => {
    await projectPage.clickTab('inventory');
    await page.waitForTimeout(1000);
    await projectPage.expectAddButtonVisible(/إضافة يدوياً|Add Item/i);
  });
});
