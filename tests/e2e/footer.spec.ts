import { test, expect } from '@playwright/test';

const CREDIT = '.site-foot a[href="https://sashagrigori.github.io/"]';
const HOMES = ['/', '/coordination'];
const OTHERS = ['/archive', '/privacy', '/work/zelenka', '/coordination/art-connections', '/no-such-page'];

async function expectCredit(page: import('@playwright/test').Page, path: string) {
  await expect(page.locator(CREDIT), path).toBeVisible();
  await expect(page.locator(CREDIT), path).toHaveText(/^Site by Aleksandra Zianchurina/);
  await expect(page.locator(CREDIT), path).toHaveAttribute('target', '_blank');
}

test('on desktop the credit is on the two home pages only', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  for (const path of HOMES) {
    await page.goto(path);
    await expectCredit(page, path);
  }
  for (const path of ['/about', ...OTHERS]) {
    await page.goto(path);
    await expect(page.locator(CREDIT), path).toBeHidden();
  }
});

test('on phones the credit is on About only', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/about');
  await expectCredit(page, '/about');
  for (const path of [...HOMES, ...OTHERS]) {
    await page.goto(path);
    await expect(page.locator(CREDIT), path).toBeHidden();
  }
});

test('on desktop the credit sits in the first screen, under the works', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  for (const size of [
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    for (const path of HOMES) {
      await page.goto(path);
      const at = `${path} ${size.width}×${size.height}`;
      const credit = (await page.locator(CREDIT).boundingBox())!;
      const works = (await page.locator('[data-strip], [data-project-list]').boundingBox())!;
      expect(credit.y, at).toBeGreaterThanOrEqual(works.y + works.height);
      expect(credit.y + credit.height, at).toBeLessThanOrEqual(size.height);
      // the credit must not make the one-screen home scroll
      expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight), at).toBeLessThanOrEqual(0);
    }
  }
});

test('on phones About ends with the Contact button and the credit under it', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  const vh = page.viewportSize()!.height;
  await page.goto('/about');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const content = (await page.locator('article.about').boundingBox())!;
  const button = (await page.locator('.mobile-contact').boundingBox())!;
  const credit = (await page.locator(CREDIT).boundingBox())!;
  expect(button.y).toBeGreaterThanOrEqual(content.y + content.height);
  expect(credit.y).toBeGreaterThanOrEqual(button.y + button.height);
  expect(credit.y + credit.height).toBeLessThanOrEqual(vh);
  expect(Math.abs(credit.x + credit.width / 2 - (button.x + button.width / 2))).toBeLessThan(2);
});

test('on phones the home pages keep the Contact button clear of the works', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  for (const path of HOMES) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    const works = (await page.locator('[data-strip], [data-project-list] a:last-child').last().boundingBox())!;
    const button = (await page.locator('.mobile-contact').boundingBox())!;
    expect(works.y + works.height, path).toBeLessThanOrEqual(button.y);
  }
});
