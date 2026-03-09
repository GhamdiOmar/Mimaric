import { type Page, type Locator, expect } from '@playwright/test';

// Maps tab IDs to Arabic labels used in the UI
const TAB_LABELS: Record<string, string> = {
  overview: 'نظرة عامة',
  buildings: 'المباني',
  documents: 'الوثائق',
  maintenance: 'الصيانة',
  concepts: 'المخطط المبدئي',
  subdivision: 'التقسيم',
  approvals: 'الموافقات',
  infrastructure: 'البنية التحتية',
  inventory: 'المخزون',
  pricing: 'التسعير',
  launch: 'الإطلاق',
  readiness: 'جاهزية الإطلاق',
  map: 'خريطة المخزون',
  analytics: 'التحليلات',
};

/** Page object for /dashboard/projects/[id] */
export class ProjectDetailPage {
  readonly page: Page;
  readonly projectId: string;

  constructor(page: Page, projectId = 'dummy-offplan-project-1') {
    this.page = page;
    this.projectId = projectId;
  }

  async goto() {
    await this.page.goto(`/dashboard/projects/${this.projectId}`);
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Tab Navigation ──────────────────────────────────────────────────────

  private getTabButton(tabId: string) {
    const label = TAB_LABELS[tabId];
    if (!label) throw new Error(`Unknown tab ID: ${tabId}`);
    return this.page.getByRole('button', { name: label, exact: true });
  }

  async clickTab(tabId: string) {
    await this.getTabButton(tabId).click();
    await this.page.waitForTimeout(500);
  }

  async expectTabVisible(tabId: string) {
    await expect(this.getTabButton(tabId)).toBeVisible();
  }

  async expectTabNotVisible(tabId: string) {
    await expect(this.getTabButton(tabId)).not.toBeVisible();
  }

  // ─── Modal Open / Fill / Submit ──────────────────────────────────────────

  async openModal(buttonText: RegExp) {
    await this.page.getByRole('button', { name: buttonText }).click();
    await this.page.waitForTimeout(300);
  }

  async expectModalVisible() {
    await expect(this.page.locator('.fixed.inset-0')).toBeVisible();
  }

  async closeModalByCancel() {
    await this.page.getByRole('button', { name: /إلغاء|Cancel/i }).click();
    await this.page.waitForTimeout(300);
  }

  async closeModalByOverlay() {
    await this.page.locator('.fixed.inset-0.bg-black\\/40').click({ position: { x: 10, y: 10 } });
    await this.page.waitForTimeout(300);
  }

  async fillInput(label: string, value: string) {
    const input = this.page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + select`);
    if (await input.count() > 0) {
      await input.fill(value);
    } else {
      await this.page.locator(`input[placeholder*="${label}"], select`).first().fill(value);
    }
  }

  async selectOption(label: string, value: string) {
    const select = this.page.locator(`select`).filter({ has: this.page.locator(`option:has-text("${value}")`) }).first();
    await select.selectOption({ label: value });
  }

  async submitModal() {
    await this.page.getByRole('button', { name: /حفظ|Save/i }).click();
    await this.page.waitForTimeout(1000);
  }

  // ─── Readiness Checklist ─────────────────────────────────────────────────

  async getChecklistItems() {
    return this.page.locator('[data-testid="checklist-item"]').all();
  }

  async expectReadyBanner() {
    await expect(this.page.getByText(/جاهز للإطلاق|Ready for Launch/i)).toBeVisible();
  }

  async expectNotReadyBanner() {
    await expect(this.page.getByText(/غير جاهز|Not Ready/i)).toBeVisible();
  }

  // ─── Button Visibility ──────────────────────────────────────────────────

  async expectAddButtonVisible(text: RegExp) {
    await expect(this.page.getByRole('button', { name: text })).toBeVisible();
  }

  async expectAddButtonNotVisible(text: RegExp) {
    await expect(this.page.getByRole('button', { name: text })).not.toBeVisible();
  }
}
