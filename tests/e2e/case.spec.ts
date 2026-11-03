import { test, expect } from '@playwright/test';

const scrollLeft = (page: import('@playwright/test').Page) => page.locator('[data-track]').evaluate((t) => t.scrollLeft);

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('info column', async ({ page }) => {
    await page.goto('/work/zelenka');
    await expect(page.locator('.info h1')).toHaveText('Zelënka');
    await expect(page.locator('.info .meta')).toContainText('Years');
    await expect(page.locator('.info .meta')).toContainText('2021–2025');
    await expect(page.locator('.info .meta')).toContainText('Brand identity, packaging');
    await expect(page.locator('.info .desc')).toContainText('A long-term collaboration');
  });

  test('page itself does not scroll vertically', async ({ page }) => {
    await page.goto('/work/zelenka');
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
  });

  test('wheel scrolls the gallery sideways and updates progress', async ({ page }) => {
    await page.goto('/work/zelenka');
    const progress = page.locator('[data-progress]');
    await expect(progress).toHaveText('01 / 07');
    await page.locator('[data-track] figure').first().hover();
    for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 400);
    await expect.poll(() => scrollLeft(page)).toBeGreaterThan(1000);
    await expect(progress).not.toHaveText('01 / 07');
  });

  test('scroll hint fades after the first scroll', async ({ page }) => {
    await page.goto('/work/zelenka');
    const hint = page.locator('[data-hint]');
    expect(await hint.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await page.locator('[data-track] figure').first().hover();
    await page.mouse.wheel(0, 300);
    await expect.poll(() => hint.evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
  });

  test('arrow keys move the gallery', async ({ page }) => {
    await page.goto('/work/zelenka');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => scrollLeft(page)).toBeGreaterThan(100);
  });

  test('gallery images share one height', async ({ page }) => {
    for (const slug of ['zelenka', 'roseco-icons', 'turning-visions']) {
      await page.goto(`/work/${slug}`);
      const heights = await page
        .locator('[data-track] figure img')
        .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
      expect(Math.max(...heights) - Math.min(...heights), slug).toBeLessThanOrEqual(1);
    }
  });

  test('next link goes to the next case, the last one to Archive', async ({ page }) => {
    await page.goto('/work/zelenka');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/work/roseco-eco-boxes');
    await expect(page.locator('.next a')).toContainText('ROSECO Eco-boxes');
    await page.goto('/work/turning-visions');
    await expect(page.locator('.next a')).toHaveAttribute('href', '/archive');
    await expect(page.locator('.next a')).toContainText('Archive');
  });

  test('a long single word in the title stays inside the info column', async ({ page }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(vp);
      await page.goto('/work/roseco-icons');
      const fits = await page.locator('.info h1').evaluate((h) => {
        h.textContent = 'Metropolitan Iconography';
        const info = h.closest('.info')!.getBoundingClientRect();
        const r = document.createRange();
        r.selectNodeContents(h);
        return [...r.getClientRects()].every((rect) => rect.right <= info.right + 0.5);
      });
      expect(fits, `${vp.width}x${vp.height}`).toBe(true);
    }
  });

  test('first gallery image is the cover and shares the transition name with the strip', async ({ page }) => {
    await page.goto('/');
    const fromStrip = await page.locator('a[data-case]').first().locator('.ph').evaluate((e) => getComputedStyle(e).viewTransitionName);
    await page.goto('/work/zelenka');
    const first = page.locator('[data-track] figure').first();
    expect(await first.evaluate((e) => getComputedStyle(e).viewTransitionName)).toBe(fromStrip);
    expect(fromStrip).not.toBe('none');
    await expect(first.locator('img')).toHaveAttribute('alt', 'Zelënka soap box on birch wood and stone');
  });
});

test('mobile shows every gallery image whole, not cropped', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  for (const slug of ['zelenka', 'roseco-icons', 'turning-visions']) {
    await page.goto(`/work/${slug}`);
    // width/height attributes carry the intrinsic ratio even for lazy images that have not loaded yet
    const ratios = await page.locator('[data-track] figure img').evaluateAll((els) =>
      els.map((e) => {
        const box = e.getBoundingClientRect();
        return {
          shown: box.width / box.height,
          natural: Number(e.getAttribute('width')) / Number(e.getAttribute('height')),
          fit: getComputedStyle(e).objectFit,
        };
      }),
    );
    for (const r of ratios) {
      const cropped = r.fit === 'cover' && Math.abs(r.shown / r.natural - 1) > 0.03;
      expect(cropped, `${slug}: shown ${r.shown.toFixed(2)} vs natural ${r.natural.toFixed(2)}`).toBe(false);
    }
  }
});

test('mobile stacks text above a swipe gallery', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/work/zelenka');
  const title = (await page.locator('.info h1').boundingBox())!;
  const track = page.locator('[data-track]');
  const t = (await track.boundingBox())!;
  expect(title.y + title.height).toBeLessThanOrEqual(t.y);
  expect(await track.evaluate((e) => getComputedStyle(e).scrollSnapType)).toBe('x mandatory');
  const w = (await track.locator('figure').first().boundingBox())!.width;
  const vw = page.viewportSize()!.width;
  expect(w / vw).toBeGreaterThan(0.7);
  expect(w / vw).toBeLessThan(0.92);
  const left = (await track.locator('figure').first().boundingBox())!.x;
  const titleLeft = title.x;
  expect(Math.abs(left - titleLeft)).toBeLessThan(2);
});

test('mobile: swiping to the end shows the next-case link whole', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  const vw = page.viewportSize()!.width;
  for (const path of ['/work/zelenka', '/work/turning-visions']) {
    await page.goto(path);
    await page.locator('[data-track]').evaluate((t) => t.scrollTo({ left: t.scrollWidth }));
    await page.waitForTimeout(600);
    for (const sel of ['.next span', '.next a']) {
      const box = (await page.locator(sel).boundingBox())!;
      expect(box.x, `${path} ${sel}`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${path} ${sel}`).toBeLessThanOrEqual(vw);
    }
  }
});
