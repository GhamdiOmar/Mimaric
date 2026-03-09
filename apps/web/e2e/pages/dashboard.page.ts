import { type Page, expect } from '@playwright/test';

/** Page object for /dashboard */
export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /** Check KPI card label is visible within the main content area */
  async expectKPICardVisible(labelAr: string) {
    const main = this.page.locator('main');
    await expect(main.getByText(labelAr, { exact: true }).first()).toBeVisible();
  }

  async expectOffPlanSection() {
    const main = this.page.locator('main');
    await expect(main.getByText('مشاريع البيع على الخارطة')).toBeVisible();
    await expect(main.getByText('إجمالي المخزون')).toBeVisible();
    await expect(main.getByText('معدل التحويل')).toBeVisible();
    await expect(main.getByText('قيمة المبيعات')).toBeVisible();
  }

  async expectKPIValue(labelAr: string, expectedValue: string | RegExp) {
    const main = this.page.locator('main');
    const card = main.locator('div').filter({ hasText: labelAr }).first();
    if (typeof expectedValue === 'string') {
      await expect(card).toContainText(expectedValue);
    } else {
      await expect(card.locator('h3')).toHaveText(expectedValue);
    }
  }
}
