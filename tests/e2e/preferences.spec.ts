import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('language and theme persist without changing an existing order draft', async ({
  page,
}, info) => {
  await page.goto('/demo/ordens/nova');
  await page.getByLabel('Nome do cliente').fill('Fernanda QA');
  await page.getByLabel('Resumo do serviço').fill('Revisão escolhida pelo cliente');
  const data = await page.evaluate(() => localStorage.getItem('patio.demo.v1'));
  await page.locator('.topbar').getByRole('button', { name: 'Idioma', exact: true }).click();
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-language-light.png`,
    animations: 'disabled',
  });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.getByRole('menuitemradio', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Use dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByLabel('Customer name')).toHaveValue('Fernanda QA');
  expect(await page.evaluate(() => localStorage.getItem('patio.demo.v1'))).toBe(data);
  await page.reload();
  await expect(page.getByLabel('Customer name')).toHaveValue('Fernanda QA');
  await expect(page.getByLabel('Service summary')).toHaveValue('Revisão escolhida pelo cliente');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.topbar').getByRole('button', { name: 'Language', exact: true }).click();
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-language-dark.png`,
    animations: 'disabled',
  });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.getByRole('menuitemradio', { name: /Português/ }).click();
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await expect(page.getByLabel('Nome do cliente')).toHaveValue('Fernanda QA');
  expect(await page.evaluate(() => localStorage.getItem('patio.demo.v1'))).toBe(data);
});

test('English views and dialogs remain readable in both themes', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo');
  await page.locator('.topbar').getByRole('button', { name: 'Idioma', exact: true }).click();
  await page.getByRole('menuitemradio', { name: /English/ }).click();
  for (const theme of ['dark', 'light']) {
    await page
      .getByRole('button', { name: theme === 'dark' ? 'Use dark mode' : 'Use light mode' })
      .click();
    for (const [path, heading] of [
      ['/demo', 'A good day starts in the workshop'],
      ['/demo/ordens/nova', 'Check in a vehicle'],
      ['/demo/clientes', 'Customers & vehicles'],
      ['/demo/recebimentos', 'Payments'],
      ['/demo/ajustes', 'Demo settings'],
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        `${path} ${theme}`,
      ).toEqual([]);
      if (path === '/demo')
        await page.screenshot({
          path: `docs/screenshots/${info.project.name}-en-${theme}.png`,
          fullPage: true,
          animations: 'disabled',
        });
    }
    await page.goto('/demo/ordens/1042');
    await expect(page.getByRole('heading', { name: 'Clarity in every item' })).toBeVisible();
    await expect(page.getByText('Brake pad set', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Simulate approval', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Your customer’s view');
    await page.screenshot({
      path: `docs/screenshots/${info.project.name}-approval-${theme}.png`,
      animations: 'disabled',
    });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('English actions use stable domain values and reset keeps preferences', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('.topbar').getByRole('button', { name: 'Idioma', exact: true }).click();
  await page.getByRole('menuitemradio', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Use dark mode' }).click();
  await page.getByLabel('Search service orders').fill('Brake');
  await expect(page.locator('.order-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Open order 1042, Honda Fit' }).click();
  await page.getByRole('button', { name: 'Simulate approval', exact: true }).click();
  await page.getByRole('button', { name: 'Approve all items' }).click();
  await page.getByRole('tab', { name: 'Payments', exact: true }).click();
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await page.getByLabel('Payment method').selectOption({ label: 'Cash' });
  await page.getByLabel('Amount (BRL)').fill('100');
  await page.getByRole('button', { name: 'Confirm simulated payment' }).click();
  await expect(page.getByText('Cash · simulated entry')).toBeVisible();
  const method = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('patio.demo.v1')!).orders.find(
        (o: { number: number }) => o.number === 1042,
      ).payments[0].method,
  );
  expect(method).toBe('Dinheiro');
  await page.getByRole('tab', { name: 'History', exact: true }).click();
  await expect(page.getByText('Simulated payment: R$100.00 by Cash.')).toBeVisible();
  await page.goto('/demo/ajustes');
  await page.locator('main').getByRole('button', { name: 'Reset sample data' }).click();
  await page.getByRole('button', { name: 'Reset demonstration' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.order-card')).toHaveCount(6);
});
