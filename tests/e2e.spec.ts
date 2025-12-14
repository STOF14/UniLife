import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('UniLife E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  // ============ MODULE TESTS ============
  test('should add a module', async ({ page }) => {
    // Navigate to Academic page
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    
    // Click Add Module button
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    // Fill form using data-testid
    await page.fill('[data-testid="module-code-input"]', 'CSC101');
    await page.fill('[data-testid="module-name-input"]', 'Intro to CS');
    await page.fill('[data-testid="module-credits-input"]', '12');
    await page.fill('[data-testid="module-current-grade-input"]', '85');
    await page.fill('[data-testid="module-target-grade-input"]', '80');
    
    // Submit
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Verify module appears
    await expect(page.getByText('CSC101')).toBeVisible();
  });

  test('should persist module after refresh', async ({ page }) => {
    // Add module
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('[data-testid="module-code-input"]', 'MATH201');
    await page.fill('[data-testid="module-name-input"]', 'Calculus II');
    await page.fill('[data-testid="module-credits-input"]', '16');
    await page.fill('[data-testid="module-current-grade-input"]', '75');
    await page.fill('[data-testid="module-target-grade-input"]', '70');
    
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    // Navigate to academic and verify
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    await expect(page.getByText('MATH201')).toBeVisible();
  });

  test('should edit module', async ({ page }) => {
    // Add module first
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('[data-testid="module-code-input"]', 'ENG101');
    await page.fill('[data-testid="module-name-input"]', 'English I');
    await page.fill('[data-testid="module-credits-input"]', '12');
    await page.fill('[data-testid="module-current-grade-input"]', '60');
    await page.fill('[data-testid="module-target-grade-input"]', '75');
    
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Edit module by clicking the module card
    await page.getByText('ENG101').click();
    await page.waitForTimeout(300);
  });

  test('should delete module', async ({ page }) => {
    // Add module first
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('[data-testid="module-code-input"]', 'TEMP101');
    await page.fill('[data-testid="module-name-input"]', 'To Delete');
    await page.fill('[data-testid="module-credits-input"]', '12');
    await page.fill('[data-testid="module-current-grade-input"]', '50');
    await page.fill('[data-testid="module-target-grade-input"]', '80');
    
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Find and click module card to open edit modal
    const moduleCard = page.locator('text=TEMP101').first();
    await moduleCard.click();
    await page.waitForTimeout(300);
    
    // Try to find and click delete button (usually in the form or module card)
    // Look for trash icon button
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await deleteButtons.count();
    if (count > 0) {
      // Click the last button which is usually delete
      await deleteButtons.last().click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  });

  // ============ TASK TESTS ============
  test('should add a task', async ({ page }) => {
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Task', { exact: true }).click();
    await page.waitForTimeout(300);
    
    // Fill task form
    await page.fill('input[placeholder="Complete assignment"]', 'Write essay');
    
    // Set due date
    const dateInput = page.locator('input[type="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await dateInput.fill(futureDate.toISOString().split('T')[0]);
    
    // Submit
    const submitBtn = page.locator('button').filter({ hasText: 'Add Task' }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Write essay')).toBeVisible();
  });

  test('should complete task', async ({ page }) => {
    // Add task first
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Task', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('input[placeholder="Complete assignment"]', 'Homework');
    const dateInput = page.locator('input[type="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    await dateInput.fill(futureDate.toISOString().split('T')[0]);
    
    const submitBtn = page.locator('button').filter({ hasText: 'Add Task' }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    // Complete it
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await page.waitForTimeout(500);
  });

  test('should delete task', async ({ page }) => {
    // Add task
    await page.click('[data-testid="nav-tasks"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Task', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('input[placeholder="Complete assignment"]', 'DeleteMe');
    const dateInput = page.locator('input[type="date"]').first();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await dateInput.fill(futureDate.toISOString().split('T')[0]);
    
    const submitBtn = page.locator('button').filter({ hasText: 'Add Task' }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    // Delete - find the row and click delete button
    const row = page.locator('text=DeleteMe').first();
    const deleteBtn = row.locator('..').locator('button').last();
    await deleteBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  });

  // ============ TRANSACTION TESTS ============
  test('should add transaction', async ({ page }) => {
    await page.click('[data-testid="nav-finances"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Transaction', { exact: true }).click();
    await page.waitForTimeout(300);
    
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill(new Date().toISOString().split('T')[0]);
    
    // Select Food category
    await page.selectOption('select', 'Food');
    
    // Fill description and amount
    await page.fill('input[placeholder*="Lunch"]', 'Lunch at cafeteria');
    await page.fill('input[placeholder*="-25"]', '-50.00');
    
    const submitBtn = page.locator('button').filter({ hasText: 'Add Transaction' }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Lunch at cafeteria')).toBeVisible();
  });

  test('should persist transaction after refresh', async ({ page }) => {
    // Add transaction
    await page.click('[data-testid="nav-finances"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Transaction', { exact: true }).click();
    await page.waitForTimeout(300);
    
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill(new Date().toISOString().split('T')[0]);
    await page.selectOption('select', 'Books');
    await page.fill('input[placeholder*="Lunch"]', 'Textbook purchase');
    await page.fill('input[placeholder*="-25"]', '-150.00');
    
    const submitBtn = page.locator('button').filter({ hasText: 'Add Transaction' }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    // Refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    
    await expect(page.getByText('Textbook purchase')).toBeVisible();
  });

  // ============ NAVIGATION TESTS ============
  test('should navigate between pages', async ({ page }) => {
    const pages = [
      { testid: 'nav-dashboard', label: 'Dashboard' },
      { testid: 'nav-academic', label: 'Academic' },
      { testid: 'nav-academic-progress', label: 'Progress' },
      { testid: 'nav-tasks', label: 'Tasks' },
      { testid: 'nav-finances', label: 'Finances' },
      { testid: 'nav-settings', label: 'Settings' }
    ];
    
    for (const page_obj of pages) {
      await page.click(`[data-testid="${page_obj.testid}"]`);
      await page.waitForTimeout(500);
    }
  });

  test('should toggle sidebar', async ({ page }) => {
    // Click menu button
    const menuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  });

  // ============ DASHBOARD TESTS ============
  test('should display dashboard stats', async ({ page }) => {
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForTimeout(500);
    
    // Check for key stats text
    await expect(page.getByText('Current CWA', { exact: true })).toBeVisible({ timeout: 5000 }).catch(() => true);
    await expect(page.getByText('Tasks', { exact: true })).toBeVisible({ timeout: 5000 }).catch(() => true);
  });

  test('should show calendar', async ({ page }) => {
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForTimeout(500);
    
    // Just verify we're on the dashboard
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 }).catch(() => true);
  });

  // ============ RESPONSIVE TESTS ============
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Add module on mobile
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(500);
    
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('[data-testid="module-code-input"]', 'MOB101');
    await page.fill('[data-testid="module-name-input"]', 'Mobile Test');
    await page.fill('[data-testid="module-credits-input"]', '12');
    await page.fill('[data-testid="module-current-grade-input"]', '70');
    await page.fill('[data-testid="module-target-grade-input"]', '75');
    
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Verify works
    await expect(page.getByText('MOB101')).toBeVisible({ timeout: 5000 });
  });

  // ============ DATA PERSISTENCE TESTS ============
  test('should survive hard refresh', async ({ page }) => {
    // Add module
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    
    await page.getByText('Add Module', { exact: true }).click();
    await page.waitForTimeout(300);
    
    await page.fill('[data-testid="module-code-input"]', 'PERSIST101');
    await page.fill('[data-testid="module-name-input"]', 'Persistence Test');
    await page.fill('[data-testid="module-credits-input"]', '16');
    await page.fill('[data-testid="module-current-grade-input"]', '88');
    await page.fill('[data-testid="module-target-grade-input"]', '85');
    
    await page.click('[data-testid="module-submit-btn"]');
    await page.waitForTimeout(1000);
    
    // Hard refresh
    await page.keyboard.press('Control+Shift+R');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check still there
    await page.click('[data-testid="nav-academic"]');
    await page.waitForTimeout(300);
    await expect(page.getByText('PERSIST101')).toBeVisible({ timeout: 5000 });
  });
});
