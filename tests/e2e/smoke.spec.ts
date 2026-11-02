import { test, expect } from '@playwright/test';

test('home responds with lang=en and design mode', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html[lang="en"][data-mode="design"][data-page="home"]')).toHaveCount(1);
});

test('no Google Fonts requests', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(urls.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
});

test('both font families load', async ({ page }) => {
  await page.goto('/');
  // document.fonts.check() is vacuously true for undeclared families, so look for loaded FontFace objects
  const loaded = await page.evaluate(async () => {
    await Promise.all([document.fonts.load('16px "Inter Tight"'), document.fonts.load('italic 16px "Instrument Serif"')]);
    return [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')}|${f.style}`);
  });
  expect(loaded).toContain('Inter Tight|normal');
  expect(loaded).toContain('Instrument Serif|italic');
});
