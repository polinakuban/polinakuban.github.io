import { test, expect, type Locator } from '@playwright/test';

const lefts = (l: Locator) => l.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('dark mode, header and title', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coordination');
    await expect(page.locator('header .back')).toHaveAttribute('href', '/coordination');
    await expect(page.locator('header .center')).toHaveText('02 / 05');
    await expect(page.locator('.project h1')).toHaveText('Product launch event');
  });

  test('meta row', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    const meta = page.locator('.project .meta');
    for (const text of ['Role', 'Event coordinator', 'Client', 'Brand TBD', 'Team', '6 vendors, 4 in-house', 'Timeline', '6 weeks, 2025']) {
      await expect(meta).toContainText(text);
    }
  });

  test('sections sit on the grid', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    await expect(page.locator('.sec .lbl')).toHaveText(['Challenge', 'What I did', 'Result']);
    const bodies = await lefts(page.locator('.sec .body'));
    const labels = await lefts(page.locator('.sec .lbl'));
    expect(Math.max(...bodies) - Math.min(...bodies)).toBeLessThanOrEqual(1);
    expect(Math.max(...labels) - Math.min(...labels)).toBeLessThanOrEqual(1);
    expect(labels[0]).toBeLessThan(bodies[0]);
    const metaClient = (await page.locator('.meta [data-col="2"]').boundingBox())!.x;
    expect(Math.abs(metaClient - bodies[0])).toBeLessThanOrEqual(1);
  });

  test('what I did is a list and results are serif numbers', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    await expect(page.locator('.sec ul.did li')).toHaveCount(4);
    const results = page.locator('.results li');
    await expect(results.locator('b')).toHaveText(['150', '0', '3']);
    await expect(results.first()).toContainText('guests');
    expect(await results.first().locator('b').evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Instrument Serif');
  });

  test('placeholder images fill the photo row', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    const photos = page.locator('.photos > img');
    await expect(photos).toHaveCount(3);
    await expect(photos.first()).toHaveAttribute('alt', 'Placeholder image for Product launch event');
    for (const p of await photos.all()) expect(await p.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
  });

  test('photo row: small photos are 4:3 and the wide one matches their height', async ({ page }) => {
    // <img> carries its file's width/height attributes, which used to win over aspect-ratio
    await page.goto('/coordination/product-launch-event');
    const boxes = await page.locator('.photos > img').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(boxes[1].width / boxes[1].height).toBeCloseTo(4 / 3, 1);
    expect(Math.abs(boxes[0].height - boxes[1].height)).toBeLessThanOrEqual(1);
    expect(Math.abs(boxes[2].height - boxes[1].height)).toBeLessThanOrEqual(1);
  });

  test('next project loops from the last to the first', async ({ page }) => {
    await page.goto('/coordination/product-launch-event');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/coordination/packaging-print-run');
    await page.goto('/coordination/exhibition-installation');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/coordination/brand-photo-shoot');
    await expect(page.locator('.next a')).toContainText('Brand photo shoot');
  });
});

test('mobile is a single column', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/coordination/product-launch-event');
  const label = (await page.locator('.sec .lbl').first().boundingBox())!;
  const body = (await page.locator('.sec .body').first().boundingBox())!;
  expect(Math.abs(label.x - body.x)).toBeLessThanOrEqual(1);
  expect(label.y + label.height).toBeLessThanOrEqual(body.y);
  for (const b of await page.locator('.photos > img').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))) {
    expect(b.width / b.height).toBeCloseTo(4 / 3, 1);
  }
});
