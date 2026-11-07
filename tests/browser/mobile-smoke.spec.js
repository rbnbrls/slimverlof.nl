import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
]) {
  test(`${viewport.name} primary flows fit without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('button', { name: /Maximaliseer je vrije tijd/ })).toBeVisible();

    const lightPaper = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim()
    );
    await page.getByRole('button', { name: /Schakel naar donkere modus/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim()
      )
    ).not.toBe(lightPaper);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width
    );

    const headerLayout = await page.evaluate(() => {
      const controls = document.querySelector('.header-controls').getBoundingClientRect();
      const title = document.querySelector('.title').getBoundingClientRect();
      const subtitle = document.querySelector('.subtitle').getBoundingClientRect();

      return {
        controlsBottom: controls.bottom,
        titleTop: title.top,
        titleBottom: title.bottom,
        subtitleTop: subtitle.top,
      };
    });

    expect(headerLayout.controlsBottom).toBeLessThanOrEqual(headerLayout.titleTop);
    expect(headerLayout.titleBottom).toBeLessThanOrEqual(headerLayout.subtitleTop);

    for (const selector of ['.theme-toggle', '.header-controls > .share-btn', '.share-container > .share-btn']) {
      const iconButton = page.locator(selector);
      await iconButton.hover();
      await expect
        .poll(async () =>
          page.locator(selector).evaluate((element) => getComputedStyle(element, '::after').opacity)
        )
        .toBe('1');
    }

    await page.getByRole('button', { name: /Maximaliseer je vrije tijd/ }).click();
    await page.getByRole('button', { name: 'Volgende' }).click();
    await page.getByRole('button', { name: 'Volgende' }).click();
    await page.getByRole('button', { name: 'Bereken mijn verlof' }).click();
    await expect(page.getByRole('heading', { name: /Je bent .* dagen vrij/ })).toBeVisible();
    await page.getByRole('button', { name: 'Opnieuw beginnen', exact: true }).click();
    await expect(page.getByRole('button', { name: /Maximaliseer je vrije tijd/ })).toBeVisible();
    await page.getByRole('button', { name: 'Opnieuw beginnen met slimverlof.nl' }).click();

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
