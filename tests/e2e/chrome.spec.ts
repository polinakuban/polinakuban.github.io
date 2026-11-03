import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', mode: 'design' },
  { path: '/coordination', mode: 'coordination' },
  { path: '/work/zelenka', mode: 'design' },
  { path: '/coordination/living-tradition', mode: 'coordination' },
  { path: '/about', mode: 'design' },
  { path: '/archive', mode: 'design' },
  { path: '/privacy', mode: 'design' },
  { path: '/does-not-exist', mode: 'design' },
];

for (const { path, mode } of routes) {
  test(`chrome on ${path}`, async ({ page, isMobile }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(path === '/does-not-exist' ? 404 : 200);
    await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
    if (isMobile) {
      await expect(page.locator('.spine')).toBeHidden();
      await expect(page.locator('.name-mobile')).toBeVisible();
    } else {
      await expect(page.locator('.spine')).toBeVisible();
      await expect(page.locator('header button[data-contact-open]')).toHaveText('Contact me');
      await expect(page.locator('header button[data-contact-open]')).toBeVisible();
    }
  });
}

test('no horizontal page scroll on any route', async ({ page }) => {
  for (const { path } of routes) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('no horizontal page scroll while web fonts are still missing', async ({ page }) => {
  await page.route(/\.woff2?$/, (r) => r.abort());
  for (const { path } of routes) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('mobile name keeps the same margin on both sides', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const m = await page.locator('.name-mobile').evaluate((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const text = r.getBoundingClientRect();
    return { left: text.left, right: window.innerWidth - text.right };
  });
  expect(m.right).toBeGreaterThanOrEqual(m.left * 0.6);
});

const centerX = (b: { x: number; width: number }) => b.x + b.width / 2;

for (const { path, current } of [{ path: '/', current: 'Design' }, { path: '/coordination', current: 'Coordination' }]) {
  test(`mode switch marks ${current} and puts the knob under it`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('header .switch a')).toHaveText(['Design', 'Coordination']);
    await expect(page.locator('header .switch a[aria-current="page"]')).toHaveText(current);
    const knob = (await page.locator('header .switch .knob').boundingBox())!;
    const link = (await page.locator('header .switch a', { hasText: current }).boundingBox())!;
    expect(Math.abs(centerX(knob) - centerX(link))).toBeLessThan(knob.width / 4);
  });
}

test('mode switch links go to the two homes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header .switch a', { hasText: 'Design' })).toHaveAttribute('href', '/');
  await expect(page.locator('header .switch a', { hasText: 'Coordination' })).toHaveAttribute('href', '/coordination');
});

test('knob slides between parts as a shared element', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('header .switch .knob').evaluate((e) => getComputedStyle(e).viewTransitionName)).toBe('switch-knob');
});

test('on About the switch has no current part and About is marked', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('header .switch a[aria-current]')).toHaveCount(0);
  await expect(page.locator('header .switch .knob')).toBeHidden();
  await expect(page.locator('header a[aria-current="page"]')).toHaveText('About');
});

test('About sits just before Contact me', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  const about = (await page.locator('header a.about').boundingBox())!;
  const pill = (await page.locator('header .pill').boundingBox())!;
  expect(about.x + about.width).toBeLessThan(pill.x);
  expect(Math.abs(about.y + about.height / 2 - (pill.y + pill.height / 2))).toBeLessThan(3);
});

test('on phones About sits on the name row, clear of the switch', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  const vw = page.viewportSize()!.width;
  for (const path of ['/', '/coordination', '/about']) {
    await page.goto(path);
    await expect(page.locator('header a.about'), path).toBeHidden();
    const about = (await page.locator('.mobile-about').boundingBox())!;
    const name = await page.locator('.name-mobile').evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const b = r.getBoundingClientRect();
      return { right: b.right, top: b.top, bottom: b.bottom };
    });
    const sw = (await page.locator('header .switch').boundingBox())!;
    expect(about.x, path).toBeGreaterThan(name.right + 8);
    expect(about.x + about.width, path).toBeLessThanOrEqual(vw - 10);
    expect(about.y, path).toBeGreaterThanOrEqual(name.top);
    expect(about.y + about.height, path).toBeLessThanOrEqual(name.bottom + 4);
    expect(about.y + about.height, path).toBeLessThan(sw.y);
  }
  await expect(page.locator('.mobile-about')).toHaveAttribute('aria-current', 'page');
  for (const path of ['/archive', '/work/zelenka', '/coordination/art-connections']) {
    await page.goto(path);
    await expect(page.locator('.mobile-about'), path).toHaveCount(0);
  }
});

test('desktop keeps About in the header', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await expect(page.locator('header a.about')).toBeVisible();
  await expect(page.locator('.mobile-about')).toBeHidden();
});

test('mobile switch spans most of the width', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const sw = (await page.locator('header .switch').boundingBox())!;
  expect(sw.width).toBeGreaterThan(page.viewportSize()!.width * 0.55);
});

test('case and project headers show back link and counter', async ({ page }) => {
  await page.goto('/work/roseco-eco-boxes');
  await expect(page.locator('header .back')).toHaveAttribute('href', '/');
  await expect(page.locator('header .back')).toContainText('All works');
  await expect(page.locator('header .center')).toHaveText('02 / 04');
  await page.goto('/coordination/barka-workshop');
  await expect(page.locator('header .back')).toHaveAttribute('href', '/coordination');
  await expect(page.locator('header .center')).toHaveText('03 / 03');
  await page.goto('/archive');
  await expect(page.locator('header .center')).toHaveText('Archive');
});

test('spine fits the viewport height', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const box = await page.locator('.spine-text').boundingBox();
  expect(box!.height).toBeLessThanOrEqual(720);
  expect(box!.y).toBeGreaterThanOrEqual(0);
});

test('the name leads to About from every page', async ({ page, isMobile }) => {
  const name = page.locator(isMobile ? '.name-mobile' : '.spine');
  for (const path of ['/', '/coordination', '/coordination/barka-workshop', '/work/zelenka', '/archive']) {
    await page.goto(path);
    await expect(name, path).toHaveAttribute('href', '/about');
  }
  await page.goto('/coordination');
  await name.click();
  await expect(page).toHaveURL(/\/about$/);
});
