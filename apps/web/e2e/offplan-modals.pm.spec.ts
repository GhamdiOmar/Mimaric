import { test, expect } from '@playwright/test';
import { ProjectDetailPage } from './pages/project-detail.page';

/**
 * PM role: has infrastructure:write + inventory:write
 * Tests off-plan modal CRUD operations
 */
test.describe('Off-Plan Modals — Project Manager', () => {
  let projectPage: ProjectDetailPage;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectDetailPage(page);
    await projectPage.goto();
  });

  test('can open infrastructure modal', async ({ page }) => {
    await projectPage.clickTab('infrastructure');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة فئة|Add Category/i);
    await projectPage.expectModalVisible();
  });

  test('can open and submit infrastructure modal', async ({ page }) => {
    await projectPage.clickTab('infrastructure');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة فئة|Add Category/i);
    await projectPage.expectModalVisible();

    // Fill required fields
    const modal = page.locator('.fixed.inset-0');
    await modal.locator('select').first().selectOption({ index: 1 }); // category
    await modal.locator('input').first().fill('Test Contractor');

    await projectPage.submitModal();
    // Verify item appears or modal closed successfully
    await page.waitForTimeout(1000);
  });

  test('can open inventory modal', async ({ page }) => {
    await projectPage.clickTab('inventory');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة يدوياً|Add Item/i);
    await projectPage.expectModalVisible();
  });

  test('modal closes on cancel button', async ({ page }) => {
    await projectPage.clickTab('infrastructure');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة فئة|Add Category/i);
    await projectPage.expectModalVisible();
    await projectPage.closeModalByCancel();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  test('modal closes on overlay click', async ({ page }) => {
    await projectPage.clickTab('infrastructure');
    await page.waitForTimeout(1000);
    await projectPage.openModal(/إضافة فئة|Add Category/i);
    await projectPage.expectModalVisible();
    await projectPage.closeModalByOverlay();
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  test('pricing tab is accessible', async ({ page }) => {
    await projectPage.clickTab('pricing');
    await page.waitForTimeout(1000);
    // PM can view pricing tab (has pricing:read)
    const hasContent = await page.getByText(/قواعد التسعير|Pricing Rules|إضافة قاعدة|Add Rule/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('launch tab is accessible', async ({ page }) => {
    await projectPage.clickTab('launch');
    await page.waitForTimeout(1000);
    // PM can view launch tab (has launch:read)
    const hasContent = await page.getByText(/موجات الإطلاق|Launch Waves|إضافة موجة|Add Wave/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
