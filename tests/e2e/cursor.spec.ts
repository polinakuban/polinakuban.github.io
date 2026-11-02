import { test, expect, type Page } from '@playwright/test';

const html = (page: Page) => page.locator('html');

// A point inside the empty band between the statement and the strip
async function emptySpot(page: Page) {
  const s = (await page.locator('.statement').boundingBox())!;
  return { x: s.x + 40, y: s.y + s.height + 30 };
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('empty space shows the Contact me pill', async ({ page }) => {
    await page.goto('/');
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await expect(html(page)).toHaveClass(/cursor-contact/);
    const inner = page.locator('.contact-cursor .in');
    await expect(inner).toBeVisible();
    await expect(inner).toHaveText('Contact me');
    const [pill, cur] = await Promise.all(
      ['header button[data-contact-open]', '.contact-cursor .in'].map((sel) =>
        page.locator(sel).evaluate((e) => {
          const s = getComputedStyle(e);
          return [s.borderTopLeftRadius, s.borderTopWidth, s.fontSize].join('|');
        }),
      ),
    );
    expect(cur).toBe(pill);
  });

  test('click on empty space opens the contact panel', async ({ page }) => {
    await page.goto('/');
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await expect(html(page)).toHaveClass(/cursor-contact/);
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('#contact-panel')).toBeVisible();
    await expect(html(page)).not.toHaveClass(/cursor-contact/);
  });

  test('Enter on a focused link never opens the panel while the mouse rests on empty space', async ({ page }) => {
    await page.goto('/');
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await expect(html(page)).toHaveClass(/cursor-contact/);
    await page.evaluate(() => {
      (window as any).__panelOpened = false;
      new MutationObserver(() => {
        if (document.documentElement.classList.contains('contact-open')) (window as any).__panelOpened = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    });
    await page.locator('header a', { hasText: 'About' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/about$/);
    expect(await page.evaluate(() => (window as any).__panelOpened)).toBe(false);
  });

  test('over a case the cursor becomes a b/w lens', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[data-case]').nth(1).locator('.ph').hover();
    await expect(html(page)).toHaveClass(/cursor-lens/);
    await page.waitForTimeout(600);
    const look = await page.locator('.contact-cursor .in').evaluate((e) => {
      const s = getComputedStyle(e);
      const b = e.getBoundingClientRect();
      return { round: Math.abs(b.width - b.height) < 1, filter: s.backdropFilter || (s as any).webkitBackdropFilter };
    });
    expect(look.round).toBe(true);
    expect(look.filter).toContain('grayscale(1)');
  });

  test('over the nav the cursor is native', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav a').first().hover();
    await expect(html(page)).not.toHaveClass(/cursor-(contact|lens)/);
  });

  test('coordination has the pill but no lens', async ({ page }) => {
    await page.goto('/coordination');
    await page.locator('a[data-project-row]').nth(1).hover();
    await expect(html(page)).not.toHaveClass(/cursor-(contact|lens)/);
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await expect(html(page)).toHaveClass(/cursor-contact/);
  });

  test('not on other pages', async ({ page }) => {
    await page.goto('/about');
    await page.mouse.move(600, 500, { steps: 5 });
    await expect(page.locator('.contact-cursor')).toHaveCount(0);
    await expect(html(page)).not.toHaveClass(/cursor-/);
  });

  test('reduced motion disables it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await page.waitForTimeout(300);
    await expect(html(page)).not.toHaveClass(/cursor-/);
  });

  test('cursor still tracks after navigation', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[data-case]').first().click();
    await expect(page).toHaveURL(/\/work\/zelenka$/);
    await expect(html(page)).not.toHaveClass(/cursor-/);
    await page.locator('header .back').click();
    await expect(page).toHaveURL(/\/$/);
    const p = await emptySpot(page);
    await page.mouse.move(p.x, p.y, { steps: 5 });
    await expect(html(page)).toHaveClass(/cursor-contact/);
  });
});

test('mobile has no custom cursor', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await expect(page.locator('.contact-cursor')).toBeHidden();
});
