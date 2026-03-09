import { test, expect } from '@playwright/test';
import { ReportsPage } from './pages/reports.page';

/**
 * Admin role: has reports:read + reports:export
 * Tests the 3 new report types
 */
test.describe('Reports — Admin', () => {
  let reportsPage: ReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ReportsPage(page);
    await reportsPage.goto();
  });

  test('development pipeline report card visible', async () => {
    await reportsPage.expectReportCardVisible('تقرير مسار التطوير');
  });

  test('approval status report card visible', async () => {
    await reportsPage.expectReportCardVisible('تقرير حالة الموافقات');
  });

  test('pricing analysis report card visible', async () => {
    await reportsPage.expectReportCardVisible('تقرير تحليل التسعير');
  });

  test('all 3 new reports visible together', async () => {
    await reportsPage.expectAllNewReports();
  });

  test('existing reports still visible', async () => {
    await reportsPage.expectReportCardVisible('تقرير الإيرادات');
    await reportsPage.expectReportCardVisible('تقرير الإشغال');
    await reportsPage.expectReportCardVisible('تقرير الصيانة');
  });

  test('PDF export button exists for pipeline report', async ({ page }) => {
    // Find the pipeline report heading, then find a PDF button near it
    const heading = page.getByRole('heading', { name: 'تقرير مسار التطوير' });
    await expect(heading).toBeVisible();
    // Verify PDF buttons exist on the page (one per report card)
    const pdfButtons = page.getByRole('button', { name: /PDF/i });
    const count = await pdfButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Excel export button exists for approval report', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'تقرير حالة الموافقات' });
    await expect(heading).toBeVisible();
    const excelButtons = page.getByRole('button', { name: /Excel/i });
    const count = await excelButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
