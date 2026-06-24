import { test, expect } from '@playwright/test';
import path from 'path';

test('Redesigned Header and Hero Section render correctly', async ({ page }) => {
  // Navigate to client homepage
  await page.goto('http://localhost:5173');

  // Wait for font/layout to stabilize
  await page.waitForTimeout(1000);

  // 1. Verify Site Header Style and Elements
  const header = page.locator('.site-header');
  await expect(header).toBeVisible();

  // Verify burgundy background color
  const bgColor = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  expect(bgColor).toBe('rgb(122, 11, 23)'); // #7a0b17 in RGB

  // Verify lahVenture image logo
  const brandLogo = page.locator('.brand-logo');
  await expect(brandLogo).toBeVisible();
  await expect(brandLogo).toHaveAttribute('src', /Lahventure|lahventure/);

  // Verify navigation links
  const navLinks = page.locator('.primary-nav .nav-link');
  await expect(navLinks).toHaveCount(5);
  await expect(navLinks.nth(0)).toHaveText('Shop');
  await expect(navLinks.nth(1)).toHaveText('Brands');
  await expect(navLinks.nth(2)).toHaveText('Catalog');
  await expect(navLinks.nth(3)).toHaveText('About');
  await expect(navLinks.nth(4)).toHaveText('Contact');

  // 2. Verify Hero Section Elements
  const heroSection = page.locator('.hero-section');
  await expect(heroSection).toBeVisible();

  // Verify badge, title and slogan text
  await expect(page.locator('.hero-badge-pill')).toHaveText('LIMITED TO 50 PIECES');
  await expect(page.locator('.hero-sku')).toHaveText('CH-9343.2-CUBK');
  await expect(page.locator('.hero-title-custom')).toContainText('SPACE');
  await expect(page.locator('.hero-title-custom')).toContainText('TIMER');
  await expect(page.locator('.hero-title-custom')).toContainText('JUPITER');
  await expect(page.locator('.hero-slogan-custom')).toHaveText('The Time Is Yours');

  // Verify available label and jupiter watch image
  await expect(page.locator('.hero-available-label')).toHaveText('AVAILABLE');
  const watchImg = page.locator('.hero-watch-image');
  await expect(watchImg).toBeVisible();
  const watchSrc = await watchImg.getAttribute('src');
  expect(watchSrc).toBe('/jupiter_watch.png');

  // Verify video preview widget
  const videoWidget = page.locator('.hero-video-widget');
  await expect(videoWidget).toBeVisible();
  const videoImg = videoWidget.locator('img');
  const videoImgSrc = await videoImg.getAttribute('src');
  expect(videoImgSrc).toBe('/watch_video_thumbnail.png');

  // 3. Take a screenshot for manual verification artifact
  const screenshotPath = path.resolve(
    '/Users/tanvirshahriar/.gemini/antigravity-ide/brain/9422d846-2e58-4d67-97d6-2f691c1e15d1/hero_redesign_screenshot.png'
  );
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot captured at: ${screenshotPath}`);
});
