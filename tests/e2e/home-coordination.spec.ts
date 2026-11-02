import { test, expect } from '@playwright/test';

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('coordination mode and copy', async ({ page }) => {
    await page.goto('/coordination');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coordination');
    await expect(page.locator('header .role')).toHaveText('Creative Project Coordination');
    await expect(page.locator('.statement')).toContainText('Creative projects,');
    await expect(page.locator('.statement em')).toHaveText('delivered with care.');
    await expect(page.locator('.info')).toContainText('Projects, 03');
    await expect(page.locator('.info [data-clock]')).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('rows in order', async ({ page }) => {
    await page.goto('/coordination');
    const rows = page.locator('a[data-project-row]');
    await expect(rows).toHaveCount(3);
    await expect(rows.locator('.n')).toHaveText(['01', '02', '03']);
    await expect(rows.first().locator('.t')).toHaveText('Art Connections');
    await expect(rows.first()).toHaveAttribute('href', '/coordination/art-connections');
    await expect(rows.nth(1).locator('.ty')).toHaveText('Workshop');
    await expect(rows.nth(1).locator('.sc')).toHaveText('Participation & collective knowledge');
  });

  test('peek follows cursor', async ({ page }) => {
    await page.goto('/coordination');
    const peek = page.locator('.peek');
    await expect(peek).toBeHidden();
    const row = (await page.locator('a[data-project-row]').nth(1).boundingBox())!;
    const x = row.x + row.width * 0.3;
    const y = row.y + row.height / 2;
    await page.mouse.move(x, y, { steps: 4 });
    await expect(peek).toBeVisible();
    const box = (await peek.boundingBox())!;
    expect(box.x).toBeGreaterThan(x);
    expect(Math.abs(box.y + box.height / 2 - y)).toBeLessThan(4);
    expect(await peek.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(90, 78, 60)');
    await page.mouse.move(x, 60, { steps: 4 });
    await expect(peek).toBeHidden();
  });

  test('peek shows the project cover', async ({ page }) => {
    await page.goto('/coordination');
    await page.locator('a[data-project-row]').nth(1).hover();
    const img = page.locator('.peek img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /clay-bucket/);
  });

  test('peek of a project without a cover shows only its colour', async ({ page }) => {
    // the global `img { display: block }` reset used to override [hidden],
    // leaving a broken-image icon in the corner of the colour block
    await page.goto('/coordination');
    const row = page.locator('a[data-project-row]').nth(1);
    await row.evaluate((e) => e.removeAttribute('data-peek-src'));
    await row.hover();
    await expect(page.locator('.peek')).toBeVisible();
    await expect(page.locator('.peek img')).toBeHidden();
  });

  test('peek is layered above the spine and header', async ({ page }) => {
    // main carries a view-transition-name, which makes it its own stacking context:
    // anything fixed inside it can never rise above the spine or the sticky header
    await page.goto('/coordination');
    expect(await page.locator('.peek').evaluate((e) => !!e.closest('main'))).toBe(false);
  });

  test('list cells truncate', async ({ page }) => {
    await page.goto('/coordination');
    const style = await page
      .locator('a[data-project-row] .t')
      .first()
      .evaluate((e) => {
        const s = getComputedStyle(e);
        return [s.whiteSpace, s.textOverflow, s.overflow];
      });
    expect(style).toEqual(['nowrap', 'ellipsis', 'hidden']);
  });

  test('no lens in coordination', async ({ page }) => {
    await page.goto('/coordination');
    await page.locator('a[data-project-row]').nth(1).hover();
    await expect(page.locator('html')).not.toHaveClass(/cursor-(lens|contact)/);
  });
});

test('mobile shows inline thumbnails and no peek', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/coordination');
  const thumbs = page.locator('a[data-project-row] .thumb');
  await expect(thumbs).toHaveCount(3);
  for (const t of await thumbs.all()) await expect(t).toBeVisible();
  await expect(thumbs.locator('img')).toHaveCount(3);
  await page.locator('a[data-project-row]').first().locator('.t').tap({ trial: true });
  await expect(page.locator('.peek')).toBeHidden();
});
