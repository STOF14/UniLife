import { test, expect } from '@playwright/test';

test('UniLife Full Journey', async ({ page }) => {
  // 1. Log in via UI
  await page.goto('/login');
  
  // These selectors now match the file I gave you above
  await page.getByPlaceholder('Email address').fill('test@unilife.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect to Dashboard
  await expect(page.getByText('Dashboard')).toBeVisible();

  // 2. Create Module
  const moduleCode = 'REAL-PHY';
  await page.getByRole('button', { name: 'Academic' }).click();
  await page.getByRole('button', { name: 'Add Module' }).click();
  
  await page.locator('input[name="code"]').fill(moduleCode);
  await page.locator('input[name="name"]').fill('Real Physics');
  await page.locator('input[type="number"]').first().fill('20');
  await page.locator('input[type="number"]').last().fill('85');
  await page.locator('button[type="submit"]').click();

  // 3. Create Task
  await page.getByRole('button', { name: 'Tasks' }).click();
  await page.getByRole('button', { name: /Add.*Task/i }).click();

  await page.getByPlaceholder('Complete assignment').fill('Real Database Task');
  await page.locator('input[type="date"]').fill('2025-12-01');

  // Select the module we just created (It really exists now!)
  // We use a regex to find the module option because the ID is generated dynamically
  await page.locator('div').filter({ hasText: /^Module/ })
    .getByRole('combobox')
    .selectOption({ label: 'REAL-PHY - Real Physics' }); 

  await page.locator('button:has-text("Add Task")').click();

  // 4. Verification
  // The modal should close naturally because the backend returned a real 201 Created
  await expect(page.getByRole('heading', { name: 'Add New Task' })).toBeHidden();
  await expect(page.getByText('Real Database Task')).toBeVisible();
});