import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const routes = ['/', '/coordination', '/work/zelenka', '/coordination/living-tradition', '/about', '/archive', '/privacy'];

test('mode switch fades to the dark palette and keeps the spine', async ({ page, isMobile }) => {
  test.skip(isMobile, 'spine is desktop only');
  await page.goto('/');
  await page.locator('nav a', { hasText: 'Coordination' }).click();
  await expect(page).toHaveURL(/\/coordination$/);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(18, 18, 18)');
  const spine = page.locator('.spine');
  await expect(spine).toHaveAttribute('href', '/coordination');
  expect(await spine.evaluate((e) => getComputedStyle(e).viewTransitionName)).toBe('spine');
});

test('keyboard focus is visible', async ({ page, isMobile, browserName }) => {
  test.skip(isMobile, 'keyboard on desktop');
  await page.goto('/about');
  // Safari only walks links and buttons with Option+Tab unless full keyboard access is on
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press(tab);
    if (await page.evaluate(() => document.activeElement?.matches('header .pill'))) break;
  }
  const pill = page.locator('header .pill');
  await expect(pill).toBeFocused();
  expect(await pill.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
});

for (const path of routes) {
  test(`meta tags on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/Polina Kuban/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{30,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Polina Kuban/);
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
  });
}

test('case og:image comes from the case cover', async ({ page }) => {
  await page.goto('/work/turning-visions');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /turning/);
});

test('sitemap and robots are built', async () => {
  expect(existsSync('dist/sitemap-index.xml')).toBe(true);
  expect(readFileSync('dist/robots.txt', 'utf8')).toContain('Sitemap:');
});

test('privacy page explains cookies and analytics', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('main')).toContainText('does not use cookies');
  await expect(page.locator('main')).toContainText('Cloudflare Web Analytics');
});

test('404 is styled and links home', async ({ page, isMobile }) => {
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
  await expect(page.locator('.notfound h1')).toHaveText('Page not found');
  await expect(page.locator('.notfound a[href="/"]')).toBeVisible();
  if (!isMobile) await expect(page.locator('.spine')).toBeVisible();
});

test('reduced motion turns transitions off', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop strip');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const d = await page.locator('a[data-case]').first().evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(d.split(',').every((x) => parseFloat(x) === 0)).toBe(true);
  const body = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
  expect(body.split(',').every((x) => parseFloat(x) === 0)).toBe(true);
});
