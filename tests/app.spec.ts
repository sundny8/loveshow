import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check logo and title
    await expect(page.locator('text=StartFast')).toBeVisible();
    await expect(page.locator('text=PRO')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('Ship Your SaaS');
    
    // Check navigation links
    await expect(page.locator('nav >> text=Features')).toBeVisible();
    await expect(page.locator('nav >> text=Pricing')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.locator('text=Get Started Free')).toBeVisible();
  });

  test('should navigate to features section', async ({ page }) => {
    await page.goto('/');
    
    // Click features link
    await page.click('nav >> text=Features');
    
    // Check URL hash
    await expect(page).toHaveURL(/#features/);
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Find and click theme toggle
    const themeToggle = page.locator('button:has-text("Toggle theme")');
    await themeToggle.click();
    
    // Check if dark class is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});

test.describe('Authentication', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await expect(page.locator('h3')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display sign up page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    await expect(page.locator('h3')).toContainText('Sign Up');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate between sign in and sign up', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Click sign up link
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    // Click sign in link
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should show validation for empty form submission', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for HTML5 validation (browser will prevent submission)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });
});

test.describe('Internationalization', () => {
  test('should display language switcher', async ({ page }) => {
    await page.goto('/');
    
    // Language switcher should be visible
    const languageButton = page.locator('button:has(.lucide-globe)');
    await expect(languageButton).toBeVisible();
  });

  test('should change language when clicking language option', async ({ page }) => {
    await page.goto('/');
    
    // Click language switcher
    const languageButton = page.locator('button:has(.lucide-globe)');
    await languageButton.click();
    
    // Click Chinese option
    await page.click('text=中文');
    
    // Check if URL changed to Chinese locale
    await expect(page).toHaveURL(/\/zh/);
  });
});

test.describe('Responsive Design', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Desktop nav should be hidden
    await expect(page.locator('nav.hidden.md\\:flex')).toBeHidden();
    
    // Mobile menu button should be visible
    await expect(page.locator('button:has(.lucide-menu)')).toBeVisible();
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Click menu button
    await page.click('button:has(.lucide-menu)');
    
    // Mobile menu should be visible
    await expect(page.locator('.md\\:hidden >> nav')).toBeVisible();
    
    // Click close button
    await page.click('button:has(.lucide-x)');
    
    // Mobile menu should be hidden
    await expect(page.locator('.md\\:hidden >> nav')).toBeHidden();
  });
});

test.describe('Pricing Section', () => {
  test('should display all pricing plans', async ({ page }) => {
    await page.goto('/#pricing');
    
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should highlight popular plan', async ({ page }) => {
    await page.goto('/#pricing');
    
    const popularBadge = page.locator('text=Popular');
    await expect(popularBadge).toBeVisible();
  });
});
