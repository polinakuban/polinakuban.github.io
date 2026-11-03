import { test, expect, type Page } from '@playwright/test';

const EMAIL = 'polina.kuban@gmail.com';

async function openPanel(page: Page, isMobile: boolean) {
  await page.locator(isMobile ? '.mobile-contact' : 'header button[data-contact-open]').click();
  await expect(page.locator('#contact-panel')).toBeVisible();
}

test('opens from the contact button and closes with Close and Esc', async ({ page, isMobile }) => {
  await page.goto('/');
  const panel = page.locator('#contact-panel');
  await expect(panel).toBeHidden();
  await openPanel(page, isMobile);
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('aria-modal', 'true');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#contact-panel'))).toBe(true);
  await panel.locator('button[data-contact-close]').click();
  await expect(panel).toBeHidden();
  await openPanel(page, isMobile);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('desktop: a panel slides in on the right and the page stays visible', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await openPanel(page, false);
  await page.waitForTimeout(900);
  const vw = page.viewportSize()!.width;
  const sheet = (await page.locator('#contact-panel .sheet').boundingBox())!;
  expect(Math.abs(sheet.x + sheet.width - vw)).toBeLessThan(1);
  expect(sheet.width).toBeGreaterThan(vw * 0.33);
  expect(sheet.width).toBeLessThan(vw * 0.5);
  await expect(page.locator('#contact-panel .backdrop')).toBeVisible();
});

test('clicking the dimmed page closes the panel for good', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  for (const path of ['/', '/coordination']) {
    await page.goto(path);
    await openPanel(page, false);
    await page.waitForTimeout(900);
    await page.mouse.click(400, 450);
    await expect(page.locator('#contact-panel')).toBeHidden();
    await page.waitForTimeout(900);
    await expect(page.locator('#contact-panel')).toBeHidden();
  }
});

test('mobile: the panel rises from the bottom and fills most of the screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await openPanel(page, true);
  await page.waitForTimeout(900);
  const vp = page.viewportSize()!;
  const sheet = (await page.locator('#contact-panel .sheet').boundingBox())!;
  expect(Math.abs(sheet.width - vp.width)).toBeLessThan(1);
  expect(Math.abs(sheet.y + sheet.height - vp.height)).toBeLessThan(1);
  expect(sheet.height).toBeGreaterThan(vp.height * 0.8);
});

test('contact rows: label, value and what a click does', async ({ page, isMobile }) => {
  await page.goto('/');
  await openPanel(page, isMobile);
  const rows = page.locator('#contact-panel .row');
  await expect(rows.locator('small')).toHaveText(['Email', 'Behance']);
  await expect(rows.locator('.act')).toHaveText(['Copy', '↗']);
});

test('clicking anywhere on the email row copies it', async ({ page, context, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium', 'clipboard permission can only be granted in Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await openPanel(page, isMobile);
  await page.waitForTimeout(900);
  // a real pointer click on the "Copy" hint: the stretched button covers the whole row
  const hint = (await page.locator('#contact-panel .row').first().locator('.act').boundingBox())!;
  await page.mouse.click(hint.x + hint.width / 2, hint.y + hint.height / 2);
  await expect(page.locator('[data-copy-status]')).toHaveText('Copied ✓');
  await expect(page.locator('#contact-panel .row').first().locator('.hint')).toBeHidden();
});

test('Tab keeps focus inside the open panel', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard on desktop');
  await page.goto('/');
  await openPanel(page, false);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#contact-panel'))).toBe(true);
  }
});

for (const path of ['/', '/coordination']) {
  test(`focus ring is visible inside the panel on ${path}`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard on desktop');
    await page.goto(path);
    await page.locator('header button[data-contact-open]').focus();
    await page.keyboard.press('Enter');
    const close = page.locator('#contact-panel button[data-contact-close]');
    await expect(close).toBeFocused();
    const look = await close.evaluate((e) => ({
      visible: e.matches(':focus-visible'),
      ring: getComputedStyle(e).outlineColor,
      bg: getComputedStyle(document.querySelector('#contact-panel .sheet')!).backgroundColor,
    }));
    expect(look.visible).toBe(true);
    expect(look.ring).not.toBe(look.bg);
  });
}

test('heading copy', async ({ page, isMobile }) => {
  await page.goto('/');
  await openPanel(page, isMobile);
  await expect(page.locator('#contact-panel h2')).toContainText('Let’s make');
  await expect(page.locator('#contact-panel h2 em')).toHaveText('something together.');
});

test('copy email shows Copied ✓ and hides it again', async ({ page, context, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium', 'clipboard permission can only be granted in Chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await openPanel(page, isMobile);
  await page.locator(`[data-copy="${EMAIL}"]`).click();
  const status = page.locator('[data-copy-status]');
  await expect(status).toHaveText('Copied ✓');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  await page.waitForTimeout(1900);
  await expect(status).toBeHidden();
});

test('copy falls back when clipboard rejects', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    });
  });
  await page.goto('/');
  await openPanel(page, isMobile);
  await page.locator(`[data-copy="${EMAIL}"]`).click();
  await expect(page.locator('[data-copy-status]')).toHaveText('Press ⌘C / Ctrl+C');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(EMAIL);
});

test('phone row stays hidden while settings have no phone, Behance opens externally', async ({ page, isMobile }) => {
  await page.goto('/');
  await openPanel(page, isMobile);
  await expect(page.locator('#contact-panel a[href^="tel:"]')).toHaveCount(0);
  await expect(page.locator('#contact-panel a[href="https://www.behance.net/polinakuban"]')).toHaveAttribute('target', '_blank');
  await expect(page.locator('#contact-panel a[href="/privacy"]')).toHaveCount(1);
});

test('contact panel works after navigating away and back', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.locator(isMobile ? '.mobile-about' : 'header a.about').click();
  await expect(page).toHaveURL(/\/about$/);
  await page.locator('nav a', { hasText: 'Design' }).click();
  await expect(page).toHaveURL(/\/$/);
  await openPanel(page, isMobile);
  await page.waitForTimeout(900);
  await expect(page.locator('#contact-panel')).toBeVisible();
});

test('mobile floating button is on every route', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  for (const path of ['/', '/coordination', '/work/zelenka', '/about', '/archive']) {
    await page.goto(path);
    const btn = page.locator('.mobile-contact');
    await expect(btn).toBeVisible();
    const box = (await btn.boundingBox())!;
    const vw = page.viewportSize()!;
    expect(Math.abs(box.x + box.width / 2 - vw.width / 2)).toBeLessThan(2);
    expect(vw.height - (box.y + box.height)).toBeLessThan(60);
  }
});

test('desktop hides the floating button', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await expect(page.locator('.mobile-contact')).toBeHidden();
});
