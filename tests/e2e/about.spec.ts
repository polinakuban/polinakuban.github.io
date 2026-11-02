import { test, expect, type Page } from '@playwright/test';

const lefts = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left * 10) / 10));

const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('always light with About active', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'design');
    await expect(page.locator('header a[aria-current="page"]')).toHaveText(/About/);
    await expect(page.locator('header .role')).toHaveText('Graphic Design & Project Coordination');
  });

  test('statement and bio copy', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.about-statement')).toContainText('Creating visual identities, campaigns, and narratives');
    await expect(page.locator('.about-statement em')).toHaveText('with clarity, emotion, and intention.');
    await expect(page.locator('.bio')).toContainText('graphic designer based in Budapest');
    await expect(page.locator('.portrait img')).toHaveAttribute('alt', 'Portrait of Polina Kuban in black and white');
  });

  test('grid line 1', async ({ page }) => {
    await page.goto('/about');
    const xs = [
      ...(await lefts(page, '.portrait')),
      ...(await lefts(page, '.sec-label')),
      ...(await lefts(page, '[data-col="designer"]')),
      ...(await lefts(page, '.exp .years')),
    ];
    expect(xs.length).toBeGreaterThan(6);
    expect(spread(xs)).toBeLessThanOrEqual(1);
  });

  test('grid line 2', async ({ page }) => {
    await page.goto('/about');
    const xs = [
      ...(await lefts(page, '.about-statement')),
      ...(await lefts(page, '.bio')),
      ...(await lefts(page, '[data-col="coordinator"]')),
      ...(await lefts(page, '.exp .org')),
      ...(await lefts(page, '.cv')),
    ];
    expect(xs.length).toBeGreaterThan(6);
    expect(spread(xs)).toBeLessThanOrEqual(1);
  });

  test('grid line 3', async ({ page }) => {
    await page.goto('/about');
    const xs = [...(await lefts(page, '[data-col="tools"]')), ...(await lefts(page, '.exp .role'))];
    expect(xs.length).toBeGreaterThan(3);
    expect(spread(xs)).toBeLessThanOrEqual(1);
  });

  test('statement sits on the bottom of the portrait', async ({ page }) => {
    await page.goto('/about');
    const p = (await page.locator('.portrait').boundingBox())!;
    const s = (await page.locator('.about-statement').boundingBox())!;
    expect(Math.abs(p.y + p.height - (s.y + s.height))).toBeLessThanOrEqual(2);
  });

  test('CV downloads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('a.cv[href="/cv/polina-kuban-cv.pdf"][download]')).toContainText('Download CV');
  });
});

test('mobile is a single column', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/about');
  const xs = [
    ...(await lefts(page, '.about-statement')),
    ...(await lefts(page, '.bio')),
    ...(await lefts(page, '[data-col]')),
    ...(await lefts(page, '.sec-label')),
  ];
  expect(xs.length).toBeGreaterThan(4);
  expect(spread(xs)).toBeLessThanOrEqual(1);
});
