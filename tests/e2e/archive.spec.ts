import { test, expect } from '@playwright/test';

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('title and a four-column grid', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.locator('.archive h1')).toContainText('Archive');
    await expect(page.locator('.archive h1 em')).toHaveText('2019–23');
    const tiles = page.locator('.tile');
    await expect(tiles).toHaveCount(8);
    const ys = await tiles.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ys.slice(0, 4)).size).toBe(1);
    expect(ys[4]).toBeGreaterThan(ys[0]);
    await expect(tiles.first().locator('.cap')).toContainText('Ludwig Museum');
    await expect(tiles.first().locator('.cap')).toContainText('2020');
  });

  test('lightbox opens, navigates and closes', async ({ page }) => {
    await page.goto('/archive');
    const tile = page.locator('.tile', { hasText: 'Ludwig Museum' });
    await tile.click();
    const box = page.locator('#lightbox');
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('role', 'dialog');
    await expect(box.locator('[data-lightbox-title]')).toHaveText('Ludwig Museum');
    const counter = box.locator('[data-lightbox-count]');
    await expect(counter).toHaveText('1 / 4');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('2 / 4');
    await box.locator('[data-lightbox-prev]').click();
    await expect(counter).toHaveText('1 / 4');
    await page.keyboard.press('Escape');
    await expect(box).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.closest('.tile')?.textContent)).toContain('Ludwig Museum');
  });

  test('the lightbox covers the spine', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Ludwig Museum' }).click();
    const prev = (await page.locator('#lightbox [data-lightbox-prev]').boundingBox())!;
    const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('#lightbox'), [
      prev.x + prev.width / 2,
      prev.y + prev.height / 2,
    ]);
    expect(hit).toBe(true);
  });

  test('Tab keeps focus inside the lightbox', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Ludwig Museum' }).click();
    await expect(page.locator('#lightbox')).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('#lightbox'))).toBe(true);
    }
  });

  test('focus ring is visible inside the lightbox', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Ludwig Museum' }).focus();
    await page.keyboard.press('Enter');
    const close = page.locator('#lightbox [data-lightbox-close]');
    await expect(close).toBeFocused();
    const look = await close.evaluate((e) => ({
      visible: e.matches(':focus-visible'),
      ring: getComputedStyle(e).outlineColor,
      bg: getComputedStyle(document.getElementById('lightbox')!).backgroundColor,
    }));
    expect(look.visible).toBe(true);
    expect(look.ring).not.toBe(look.bg);
    expect(look.ring).not.toBe('rgb(17, 17, 17)');
  });

  test('a single-image work hides the arrows', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Primanima poster' }).click();
    const box = page.locator('#lightbox');
    await expect(box.locator('[data-lightbox-count]')).toHaveText('1 / 1');
    await expect(box.locator('[data-lightbox-next]')).toBeHidden();
    await expect(box.locator('[data-lightbox-prev]')).toBeHidden();
  });

  test('opening a second work replaces the images', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Ludwig Museum' }).click();
    await page.keyboard.press('Escape');
    await page.locator('.tile', { hasText: 'Event poster series' }).click();
    await expect(page.locator('#lightbox [data-lightbox-count]')).toHaveText('1 / 3');
    await expect(page.locator('#lightbox .slide')).toHaveCount(3);
  });
});

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('two columns', async ({ page }) => {
    await page.goto('/archive');
    const ys = await page.locator('.tile').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(ys[0]).toBe(ys[1]);
    expect(ys[2]).toBeGreaterThan(ys[0]);
  });

  test('swipe changes image', async ({ page }) => {
    await page.goto('/archive');
    await page.locator('.tile', { hasText: 'Ludwig Museum' }).click();
    const track = page.locator('#lightbox [data-lightbox-track]');
    await track.evaluate((t) => t.scrollTo({ left: t.clientWidth }));
    await expect(page.locator('#lightbox [data-lightbox-count]')).toHaveText('2 / 4');
  });
});
