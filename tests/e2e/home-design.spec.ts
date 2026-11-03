import { test, expect, type Page } from '@playwright/test';

const widths = (page: Page) =>
  page.locator('a[data-case]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('statement in two lines', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.statement')).toContainText('Visual identities & packaging,');
    await expect(page.locator('.statement em')).toHaveText('with intention.');
  });

  test('info shows count and clock', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.info')).toContainText('Selected works, 04');
    await expect(page.locator('.info')).toContainText('Budapest, HU');
    await expect(page.locator('.info [data-clock]')).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('strip has cases plus Archive', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('a[data-case]');
    await expect(items).toHaveCount(5);
    await expect(items.last()).toHaveAttribute('href', '/archive');
    await expect(items.first()).toHaveAttribute('href', '/work/zelenka');
  });

  test('first item expanded by default', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(800);
    const w = await widths(page);
    expect(w[0] / w[1]).toBeGreaterThan(2);
  });

  test('hover expands hovered item', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[data-case]').nth(2).locator('.ph').hover();
    await page.waitForTimeout(900);
    const w = await widths(page);
    expect(Math.max(...w)).toBe(w[2]);
  });

  test('captions are number, title, type', async ({ page }) => {
    await page.goto('/');
    const cap = page.locator('a[data-case]').first().locator('.cap');
    await expect(cap.locator('.num')).toHaveText('01');
    await expect(cap.locator('.title')).toHaveText('Zelënka');
    await expect(cap.locator('.type')).toHaveText('Identity & Packaging');
    expect(await cap.locator('.num').evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Instrument Serif');
  });

  test('strip captions truncate', async ({ page }) => {
    await page.goto('/');
    const style = await page
      .locator('a[data-case] .cap .title')
      .first()
      .evaluate((e) => {
        const s = getComputedStyle(e);
        return [s.whiteSpace, s.textOverflow, s.overflow];
      });
    expect(style).toEqual(['nowrap', 'ellipsis', 'hidden']);
  });

  for (const vp of [
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
    { width: 1440, height: 900 },
  ]) {
    test(`layout holds at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.mouse.move(5, 5);
      await page.waitForTimeout(800);
      const statement = (await page.locator('.statement').boundingBox())!;
      const first = (await page.locator('a[data-case]').first().boundingBox())!;
      const strip = (await page.locator('.strip').boundingBox())!;
      expect(statement.y + statement.height).toBeLessThan(first.y);
      expect(strip.y + strip.height).toBeLessThanOrEqual(vp.height);
    });
  }

  test('click opens case', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[data-case]').first().click();
    await expect(page).toHaveURL(/\/work\/zelenka$/);
  });
});

test('mobile strip starts at the page margin', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const first = (await page.locator('a[data-case]').first().boundingBox())!;
  const statement = (await page.locator('.statement').boundingBox())!;
  expect(Math.abs(first.x - statement.x)).toBeLessThan(2);
});

test('mobile swipe strip centres and grows', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const strip = page.locator('.strip');
  await strip.evaluate((s) => {
    const it = s.querySelectorAll<HTMLElement>('a[data-case]')[2];
    s.scrollTo({ left: it.offsetLeft + it.offsetWidth / 2 - s.clientWidth / 2 });
  });
  const third = page.locator('a[data-case]').nth(2);
  await expect(third).toHaveClass(/is-active/);
  await page.waitForTimeout(700);
  const h = await page.locator('a[data-case] .ph').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(h[2]).toBeGreaterThan(h[0] * 1.4);
});
