import { test, expect } from '@playwright/test';

const CREDIT = 'a[href="https://sashagrigori.github.io/"]';

test('scrolling pages end with Privacy and the site credit', async ({ page }) => {
  for (const path of ['/coordination/art-connections', '/about', '/archive']) {
    await page.goto(path);
    const foot = page.locator('.site-foot');
    await expect(foot.locator('a[href="/privacy"]')).toHaveText('Privacy');
    await expect(foot.locator(CREDIT)).toHaveText(/^Site by Aleksandra Zianchurina/);
    await expect(foot.locator(CREDIT)).toHaveAttribute('target', '_blank');
  }
});

test('the privacy page footer does not link to itself', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('.site-foot a[href="/privacy"]')).toHaveCount(0);
  await expect(page.locator(`.site-foot ${CREDIT}`)).toBeVisible();
});

test('home pages have no footer', async ({ page }) => {
  for (const path of ['/', '/coordination']) {
    await page.goto(path);
    await expect(page.locator('.site-foot')).toHaveCount(0);
  }
});

test('design cases show the footer only where they scroll down (phones)', async ({ page, isMobile }) => {
  await page.goto('/work/zelenka');
  if (isMobile) await expect(page.locator('.site-foot')).toBeVisible();
  else await expect(page.locator('.site-foot')).toBeHidden();
});

test('on phones the Contact button does not cover the footer', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  for (const path of ['/about', '/coordination/living-tradition', '/work/zelenka']) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const credit = (await page.locator(`.site-foot ${CREDIT}`).boundingBox())!;
    const button = (await page.locator('.mobile-contact').boundingBox())!;
    expect(credit.y + credit.height, path).toBeLessThanOrEqual(button.y);
  }
});
