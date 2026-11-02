import { test, expect, type Locator } from '@playwright/test';

const lefts = (l: Locator) => l.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('dark mode, header and title', async ({ page }) => {
    await page.goto('/coordination/barka-workshop');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coordination');
    await expect(page.locator('header .back')).toHaveAttribute('href', '/coordination');
    await expect(page.locator('header .center')).toHaveText('03 / 03');
    await expect(page.locator('.project h1')).toHaveText('Bárka Workshop');
  });

  test('meta row', async ({ page }) => {
    await page.goto('/coordination/barka-workshop');
    const meta = page.locator('.project .meta');
    await expect(meta.locator('dt')).toHaveText(['Role', 'Client', 'Team', 'Timeline']);
    await expect(meta.locator('dd').first()).toHaveText('Workshop co-designer and facilitator');
  });

  test('sections sit on the grid', async ({ page }) => {
    await page.goto('/coordination/art-connections');
    await expect(page.locator('.sec .lbl')).toHaveText(['Focus', 'What I did', 'Result', 'Key learning']);
    const bodies = await lefts(page.locator('.sec .body'));
    const labels = await lefts(page.locator('.sec .lbl'));
    expect(Math.max(...bodies) - Math.min(...bodies)).toBeLessThanOrEqual(1);
    expect(Math.max(...labels) - Math.min(...labels)).toBeLessThanOrEqual(1);
    expect(labels[0]).toBeLessThan(bodies[0]);
    const metaClient = (await page.locator('.meta [data-col="2"]').boundingBox())!.x;
    expect(Math.abs(metaClient - bodies[0])).toBeLessThanOrEqual(1);
  });

  test('what I did is a list and results are serif numbers', async ({ page }) => {
    await page.goto('/coordination/art-connections');
    await expect(page.locator('.sec ul.did li')).toHaveCount(5);
    await expect(page.locator('.sec ul.did li').first()).toHaveText('Program development');
    const results = page.locator('.results li');
    await expect(results).toHaveCount(3);
    expect(await results.first().locator('b').evaluate((e) => getComputedStyle(e).fontFamily)).toContain('Instrument Serif');
  });

  test('case photos fill the photo row', async ({ page }) => {
    await page.goto('/coordination/living-tradition');
    const photos = page.locator('.photos > img');
    await expect(photos).toHaveCount(3);
    for (const p of await photos.all()) {
      await expect(p).toHaveAttribute('alt', /.{20,}/);
      expect(await p.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0);
    }
  });

  test('photo row: small photos are 4:3 and the wide one matches their height', async ({ page }) => {
    // <img> carries its file's width/height attributes, which used to win over aspect-ratio
    await page.goto('/coordination/living-tradition');
    const boxes = await page.locator('.photos > img').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(boxes[1].width / boxes[1].height).toBeCloseTo(4 / 3, 1);
    expect(Math.abs(boxes[0].height - boxes[1].height)).toBeLessThanOrEqual(1);
    expect(Math.abs(boxes[2].height - boxes[1].height)).toBeLessThanOrEqual(1);
  });

  test('next project loops from the last to the first', async ({ page }) => {
    await page.goto('/coordination/living-tradition');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/coordination/barka-workshop');
    await page.goto('/coordination/barka-workshop');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/coordination/art-connections');
    await expect(page.locator('.next a')).toContainText('Art Connections');
  });
});

test('mobile is a single column', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/coordination/living-tradition');
  const label = (await page.locator('.sec .lbl').first().boundingBox())!;
  const body = (await page.locator('.sec .body').first().boundingBox())!;
  expect(Math.abs(label.x - body.x)).toBeLessThanOrEqual(1);
  expect(label.y + label.height).toBeLessThanOrEqual(body.y);
  for (const b of await page.locator('.photos > img').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))) {
    expect(b.width / b.height).toBeCloseTo(4 / 3, 1);
  }
});
