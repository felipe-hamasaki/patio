import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('workspace pages, print preview and form have accessible structure', async ({
  page,
}, info) => {
  for (const [route, name] of [
    ['/demo/ordens/nova', 'nova-os'],
    ['/demo/clientes', 'clientes'],
    ['/demo/recebimentos', 'recebimentos'],
    ['/demo/ajustes', 'ajustes'],
  ]) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/${info.project.name}-${name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      route,
    ).toEqual([]);
  }
  await page.goto('/demo/ordens/1042');
  for (const tab of ['Entrada', 'Execução', 'Recebimentos', 'Histórico']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      tab,
    ).toEqual([]);
  }
  await page.getByRole('tab', { name: 'Orçamento', exact: true }).click();
  await page.getByRole('button', { name: 'Prévia para impressão' }).click();
  await expect(page.getByRole('dialog')).toContainText('Documento ilustrativo. Não é nota fiscal.');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-document')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('[data-slot="sidebar-wrapper"]')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Prévia para impressão' })).toBeFocused();
});
test('keyboard navigation traps the mobile drawer and returns focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/demo');
  await expect(page.locator('.order-card')).toHaveCount(6);
  const menu = page.getByRole('button', { name: 'Abrir navegação' });
  await menu.click();
  await expect(page.getByRole('dialog', { name: 'Navegação da oficina' })).toBeVisible();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.sidebar'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.sidebar'))).toBe(false);
});
test('responsive reflow at 320, 360, 768, 1024 and 1440 pixels', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      '/demo',
      '/demo/ordens/nova',
      '/demo/ordens/1042',
      '/demo/clientes',
      '/demo/recebimentos',
      '/demo/ajustes',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
  // A 1440px-wide viewport at 200% browser zoom has a 720px CSS layout viewport.
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto('/demo/ordens/1042');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('another tab cannot overwrite a quote that changed while the editor was open', async ({
  page,
  context,
}) => {
  await page.goto('/demo/ordens/1042');
  await page.getByRole('button', { name: 'Revisar orçamento' }).click();
  await page.getByLabel('Preço do item 1').fill('310');
  const other = await context.newPage();
  await other.goto('/demo/ordens/1042');
  await other.getByRole('button', { name: 'Revisar orçamento' }).click();
  await other.getByLabel('Preço do item 1').fill('350');
  await other.getByRole('button', { name: 'Salvar versão 2' }).click();
  await expect(other.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Salvar versão 2' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Outra aba alterou este orçamento',
  );
  await expect(page.getByLabel('Preço do item 1')).toHaveValue('310');
  await other.close();
});
