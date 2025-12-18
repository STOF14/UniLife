import { test, expect } from '@playwright/test';

// Use environment variables for secure login credentials
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'testuser@example.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// Define the name of the file where we'll store the authentication state (Supabase session)
const authFile = 'playwright/.auth/user.json';

test.describe('Authentication Flow', () => {

  // This test will perform the login and save the session state for reuse
  test('should successfully log in and save authentication state', async ({ page }) => {
    
    // 1. Navigate to the login page (assuming the base URL takes you to login or the dashboard)
    // The baseURL is already set to https://uni-life-bay.vercel.app/ in the config.
    await page.goto('/');

    // Check if we are already logged in (optional check, good for robustness)
    const dashboardTitle = page.getByRole('heading', { name: 'Welcome to UniLife' });
    if (await dashboardTitle.isVisible()) {
        console.log('User is already logged in, skipping login process.');
        // If already logged in, we still save the state just in case
        await page.context().storageState({ path: authFile });
        return;
    }

    // --- Start Login Interaction ---

    // 2. Input Email (Assuming input field has a label or placeholder 'Email' or 'E-mail address')
    // We'll use a more robust locator like getByLabel if possible.
    const emailInput = page.getByLabel(/Email|E-mail address/i);
    await emailInput.fill(USER_EMAIL);

    // 3. Input Password
    const passwordInput = page.getByLabel(/Password/i).first(); // Use .first() in case of multiple fields
    await passwordInput.fill(USER_PASSWORD);

    // 4. Click Login Button (Assuming a button with text 'Sign In' or 'Log in')
    const loginButton = page.getByRole('button', { name: /Sign In|Log in|Login/i });
    await loginButton.click();

    // 5. Verify successful navigation to the dashboard
    // Wait for the navigation to complete and for a dashboard-specific element to appear.
    // Replace '/dashboard' with the actual path your app redirects to after login.
    await page.waitForURL('**/dashboard'); 

    // Final check for a success element (e.g., the sidebar or a Welcome message)
    await expect(page.getByRole('heading', { name: 'Dashboard' }).or(page.getByRole('heading', { name: 'Welcome' }))).toBeVisible({ timeout: 10000 });
    
    // 6. SAVE the authentication state
    // This is the key step! It writes the session cookies/local storage to a file.
    await page.context().storageState({ path: authFile });
    console.log(`Authentication state saved to ${authFile}`);
  });
});