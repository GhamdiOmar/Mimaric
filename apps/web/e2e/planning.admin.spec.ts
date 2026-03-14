import { test, expect } from '@playwright/test';
import { PlanningPage } from './pages/planning.page';

/**
 * Admin role: planning:read, planning:import
 * Tests spatial data components, workspaces, layers, and planning tabs.
 */
test.describe('Planning OS & Spatial Data — Admin', () => {
  let planning: PlanningPage;

  test.beforeEach(async ({ page }) => {
    planning = new PlanningPage(page);
    await planning.goto();
  });

  // ─── Workspaces List Page ──────────────────────────────────────────────

  test.describe('Workspaces List', () => {
    test('displays page heading and description', async () => {
      await planning.expectPageHeading();
    });

    test('shows New Workspace button', async () => {
      await planning.expectNewWorkspaceButton();
    });

    test('shows search input', async () => {
      await planning.expectSearchInput();
    });

    test('shows status filter tabs', async () => {
      await planning.expectStatusFilterTabs();
    });

    test('opens and closes Create Workspace modal', async () => {
      await planning.clickNewWorkspace();
      await planning.expectCreateWorkspaceModal();
      await planning.closeModalByCancel();
      await planning.expectModalClosed();
    });

    test('search input filters workspaces', async ({ page }) => {
      await planning.searchWorkspaces('zzz_nonexistent_workspace_zzz');
      // Wait for the empty state to appear after client-side filter
      await expect(
        page.getByText(/لا توجد مساحات عمل|No workspaces found/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('status filter tabs are clickable', async () => {
      await planning.clickStatusFilter('Draft|مسودة');
      await planning.clickStatusFilter('All|الكل');
    });
  });

  // ─── Workspace Creation & Detail ──────────────────────────────────────

  test.describe('Workspace Detail (create-then-test)', () => {
    test.describe.configure({ mode: 'serial' });

    test('create workspace via modal and navigate to detail', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();

      await planning.clickNewWorkspace();
      await planning.expectCreateWorkspaceModal();

      // Fill in the workspace name in the first input inside the modal
      const modal = page.locator('.fixed.inset-0');
      const nameInput = modal.locator('input').first();
      await nameInput.fill('E2E Spatial Test Workspace');

      // Click Create button
      await modal.getByRole('button', { name: /إنشاء|Create/i }).click();

      // Should navigate to the new workspace detail page
      await page.waitForURL('**/dashboard/planning/**', { timeout: 10000 });
      await planning.expectWorkspaceDetailLoaded();
    });

    test('workspace detail shows Import and New Scenario buttons', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();

      // Navigate to the first workspace (the one we just created)
      const cardCount = await planning.getWorkspaceCardCount();
      expect(cardCount).toBeGreaterThan(0);
      await planning.clickFirstWorkspace();

      await planning.expectImportButton();
      await planning.expectNewScenarioButton();
    });

    test('all six workspace tabs are visible', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      for (const tab of ['map', 'scenarios', 'compliance', 'feasibility', 'comparison', 'comments']) {
        await planning.expectTabVisible(tab);
      }
    });

    test('Map tab shows map container and layer manager', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('map');
      await planning.expectMapContainer();
      await planning.expectLayerManager();
    });

    test('Map tab shows empty layers message when no spatial data', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('map');
      await planning.expectNoLayersMessage();
    });

    test('Scenarios tab shows empty state for new workspace', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('scenarios');
      await planning.expectNoScenariosMessage();
    });

    test('Compliance tab shows heading and run button', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('compliance');
      await planning.expectComplianceHeading();
      await planning.expectRunCheckButton();
    });

    test('Feasibility tab loads', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('feasibility');
      await planning.expectFeasibilityContent();
    });

    test('Comments tab loads with comment input', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickTab('comments');
      await planning.expectCommentInput();
    });

    test('Import button opens modal with format info', async ({ page }) => {
      planning = new PlanningPage(page);
      await planning.goto();
      await planning.clickFirstWorkspace();

      await planning.clickImport();
      await planning.expectImportModal();
    });
  });
});
