import { type Page, expect } from '@playwright/test';

/** Page object for /dashboard/reports */
export class ReportsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/reports');
    await this.page.waitForLoadState('networkidle');
  }

  async expectReportCardVisible(nameAr: string) {
    await expect(this.page.getByRole('heading', { name: nameAr })).toBeVisible();
  }

  async expectReportCardNotVisible(nameAr: string) {
    await expect(this.page.getByRole('heading', { name: nameAr })).not.toBeVisible();
  }

  /** Get the card container for a report by its heading text */
  getReportCard(nameAr: string) {
    // Find the heading, then go up to the card container
    return this.page.locator('div').filter({ has: this.page.getByRole('heading', { name: nameAr, exact: true }) }).last();
  }

  async clickPdfExport(nameAr: string) {
    const card = this.getReportCard(nameAr);
    await card.getByRole('button', { name: /PDF/i }).click();
  }

  async clickExcelExport(nameAr: string) {
    const card = this.getReportCard(nameAr);
    await card.getByRole('button', { name: /Excel/i }).click();
  }

  async expectAllNewReports() {
    await this.expectReportCardVisible('تقرير مسار التطوير');
    await this.expectReportCardVisible('تقرير حالة الموافقات');
    await this.expectReportCardVisible('تقرير تحليل التسعير');
  }
}
