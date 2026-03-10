import { type Page, expect } from '@playwright/test';

/** Page object for /dashboard/billing and sub-pages */
export class BillingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async gotoBilling() {
    await this.page.goto('/dashboard/billing');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoPlans() {
    await this.page.goto('/dashboard/billing/plans');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoInvoices() {
    await this.page.goto('/dashboard/billing/invoices');
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Billing Dashboard ──────────────────────────────────────────────────

  async expectBillingPageLoaded() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/الاشتراك والفوترة|Billing & Subscription/i).first()
    ).toBeVisible();
  }

  async expectCurrentPlanVisible() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/الخطة الحالية|Current Plan/i).first()
    ).toBeVisible();
  }

  async expectSubscriptionStatus(status: string | RegExp) {
    const main = this.page.locator('main');
    await expect(
      main.getByText(status, { exact: false }).first()
    ).toBeVisible();
  }

  async expectNoSubscription() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/لا يوجد اشتراك نشط|No active subscription/i).first()
    ).toBeVisible();
  }

  async expectPaymentMethodsSection() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/طرق الدفع|Payment Methods/i).first()
    ).toBeVisible();
  }

  async expectRecentInvoicesSection() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/آخر الفواتير|Recent Invoices/i).first()
    ).toBeVisible();
  }

  async expectPastDueBanner() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/الدفع متأخر|Payment past due/i).first()
    ).toBeVisible();
  }

  async clickChangePlan() {
    const main = this.page.locator('main');
    await main.getByText(/تغيير الخطة|Change Plan/i).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickViewAllInvoices() {
    const main = this.page.locator('main');
    await main.getByText(/عرض الكل|View All/i).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Plans Page ──────────────────────────────────────────────────────────

  async expectPlansPageLoaded() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/اختر خطتك|Choose Your Plan/i).first()
    ).toBeVisible();
  }

  async expectPlanCardVisible(planNamePattern: string | RegExp) {
    const main = this.page.locator('main');
    await expect(
      main.getByText(planNamePattern).first()
    ).toBeVisible();
  }

  async selectMonthlyBilling() {
    const main = this.page.locator('main');
    await main.getByText(/^شهري$|^Monthly$/i).first().click();
  }

  async selectAnnualBilling() {
    const main = this.page.locator('main');
    await main.getByText(/^سنوي$|^Annual$/i).first().click();
  }

  async clickSubscribePlan(index: number) {
    const main = this.page.locator('main');
    const buttons = main.getByRole('button', {
      name: /ابدأ تجربة مجانية|Start Free Trial|ابدأ الآن|Get Started/i,
    });
    await buttons.nth(index).click();
  }

  async expectCurrentPlanBadge() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/الخطة الحالية|Current Plan/i).first()
    ).toBeVisible();
  }

  // ─── Coupon Application ────────────────────────────────────────────────

  async expectCouponSectionVisible() {
    await expect(this.page.locator('[data-testid="coupon-section"]')).toBeVisible();
  }

  async enterCouponCode(code: string) {
    const input = this.page.locator('[data-testid="coupon-input"]');
    await input.fill(code);
  }

  async clickApplyCoupon() {
    await this.page.locator('[data-testid="apply-coupon-btn"]').click();
    // Wait for server action to complete
    await this.page.waitForTimeout(1000);
  }

  async submitCouponViaEnter(code: string) {
    const input = this.page.locator('[data-testid="coupon-input"]');
    await input.fill(code);
    await input.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async expectCouponApplied(code: string) {
    const section = this.page.locator('[data-testid="coupon-section"]');
    await expect(section.getByText(code)).toBeVisible();
  }

  async expectCouponError() {
    await expect(this.page.locator('[data-testid="coupon-error"]')).toBeVisible();
  }

  async expectDiscountedPrice() {
    await expect(this.page.locator('[data-testid="discounted-price"]').first()).toBeVisible();
  }

  async expectOriginalPriceStrikethrough() {
    await expect(this.page.locator('[data-testid="original-price"]').first()).toBeVisible();
  }

  async removeCoupon() {
    const section = this.page.locator('[data-testid="coupon-section"]');
    await section.locator('button').last().click();
  }

  // ─── Invoices Page ──────────────────────────────────────────────────────

  async expectInvoicesPageLoaded() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/^الفواتير$|^Invoices$/i).first()
    ).toBeVisible();
  }

  async expectInvoiceTableVisible() {
    await expect(this.page.locator('table')).toBeVisible();
  }

  async expectNoInvoices() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/لا توجد فواتير|No invoices yet/i).first()
    ).toBeVisible();
  }

  async expectInvoiceRow(invoiceNumber: string) {
    await expect(this.page.getByText(invoiceNumber)).toBeVisible();
  }

  async expectInvoiceStatus(invoiceNumber: string, status: string) {
    const row = this.page.locator('tr').filter({ hasText: invoiceNumber });
    await expect(row.getByText(status)).toBeVisible();
  }

  async expectVATColumn() {
    const main = this.page.locator('main');
    await expect(
      main.getByText(/ضريبة القيمة المضافة|VAT/i).first()
    ).toBeVisible();
  }

  // ─── Sidebar Navigation ─────────────────────────────────────────────────

  async navigateToBillingViaSidebar() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
    const sidebar = this.page.locator('aside, nav').first();
    await sidebar.getByText(/الاشتراك والفوترة|Billing/i).first().click();
    await this.page.waitForLoadState('networkidle');
  }
}
