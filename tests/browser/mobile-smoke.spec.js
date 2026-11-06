import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
]) {
  test(`${viewport.name} primary flows fit without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Verlof inzetten' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width
    );

    await page.getByRole('button', { name: 'Schoolvakanties' }).click();
    await expect(page.getByRole('heading', { name: 'Schoolvakanties 2026-2027' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Schooljaar' }).selectOption('2027-2028');
    await expect(page.getByRole('heading', { name: 'Schoolvakanties 2027-2028' })).toBeVisible();

    await page.getByRole('button', { name: 'Deel deze pagina' }).click();
    await expect(page.getByRole('menu', { name: 'Deelopties' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deel deze pagina' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Deelopties' })).toBeHidden();
  });
}
