import { type Page, expect } from '@playwright/test';

/** Page object for /dashboard/sales/reservations/new */
export class ReservationsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/sales/reservations/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectSourceToggleVisible() {
    await expect(this.page.getByText(/من الوحدات|From Unit/i)).toBeVisible();
    await expect(this.page.getByText(/من المخزون|From Inventory/i)).toBeVisible();
  }

  async selectSource(source: 'unit' | 'inventory') {
    if (source === 'inventory') {
      await this.page.getByText(/من المخزون|From Inventory/i).click();
    } else {
      await this.page.getByText(/من الوحدات|From Unit/i).click();
    }
    await this.page.waitForTimeout(300);
  }

  async selectCustomer(index = 0) {
    const customers = this.page.locator('.cursor-pointer').filter({ hasText: /.+/ });
    await customers.nth(index).click();
  }

  async selectProject(projectName: string) {
    await this.page.locator('select').first().selectOption({ label: projectName });
    await this.page.waitForTimeout(1000);
  }

  async selectInventoryItem(index = 0) {
    const items = this.page.locator('[class*="cursor-pointer"]').filter({ hasText: /م²|SAR/ });
    await items.nth(index).click();
  }

  async clickNext() {
    await this.page.getByRole('button', { name: /التالي|Next/i }).click();
    await this.page.waitForTimeout(500);
  }

  async clickConfirm() {
    await this.page.getByRole('button', { name: /تأكيد|Confirm/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async expectStepVisible(stepNumber: number) {
    const stepText: Record<number, RegExp> = {
      1: /اختيار العميل|Select Customer/i,
      2: /تفاصيل الوحدة|Unit.*Details/i,
      3: /مبلغ الحجز|Reservation Deposit/i,
      4: /تم تجهيز الحجز|Reservation Ready/i,
    };
    await expect(this.page.getByText(stepText[stepNumber]!)).toBeVisible();
  }

  async expectInventoryBadge() {
    await expect(this.page.getByText(/من المخزون|From Inventory/i)).toBeVisible();
  }
}
