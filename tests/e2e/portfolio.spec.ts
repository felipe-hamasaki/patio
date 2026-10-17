import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('customer and vehicle edits persist and start an order with the selected records', async ({
  page,
}, info) => {
  await page.goto('/demo/clientes');
  await page.locator('.customer-card').first().click();
  await page.getByRole('button', { name: 'Editar cliente', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar cliente', exact: true });
  await editor.getByLabel('Nome do cliente').fill('Marina Revisada');
  await editor.getByLabel('Contato', { exact: true }).fill('marina@example.com');
  await editor.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('dialog', { name: 'Marina Revisada' })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar veículo' }).click();
  const vehicle = page.getByRole('dialog', { name: 'Adicionar veículo', exact: true });
  await vehicle.getByLabel('Modelo', { exact: true }).fill('Honda Civic');
  await vehicle.getByLabel('Placa fictícia').fill('TES1234');
  await vehicle.getByLabel('Ano', { exact: true }).fill('2020');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await vehicle.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('dialog', { name: 'Marina Revisada' })).toContainText('TES1234');
  await page.getByRole('button', { name: 'Editar veículo TES1234' }).click();
  await page
    .getByRole('dialog', { name: 'Editar veículo', exact: true })
    .getByLabel('Ano', { exact: true })
    .fill('2021');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-cadastro-completo.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Criar atendimento', exact: true }).first().click();
  await expect(page.getByRole('combobox', { name: 'Cliente', exact: true })).toHaveValue('c0');
  await expect(
    page.getByRole('combobox', { name: 'Veículo do cliente', exact: true }),
  ).not.toHaveValue('');
  await expect(
    page
      .getByRole('combobox', { name: 'Veículo do cliente', exact: true })
      .locator('option:checked'),
  ).toContainText('Honda Civic');
  await page.getByLabel('Quilometragem').fill('12345');
  await page.reload();
  await expect(page.getByLabel('Quilometragem')).toHaveValue('12345');
  await expect(
    page.getByRole('combobox', { name: 'Cliente', exact: true }).locator('option:checked'),
  ).toContainText('Marina Revisada');
});

test('contextual new order preserves an unrelated draft until discarded', async ({ page }) => {
  await page.goto('/demo/ordens/nova');
  await page.getByLabel('Nome do cliente').fill('Rascunho preservado');
  await page.goto('/demo/ordens/nova?cliente=c0');
  await expect(page.getByLabel('Nome do cliente')).toHaveValue('Rascunho preservado');
  await page.getByRole('button', { name: 'Descartar rascunho' }).click();
  await expect(page.getByRole('combobox', { name: 'Cliente', exact: true })).toHaveValue('c0');
  await expect(page.getByLabel('Quilometragem')).toHaveValue('');
});

test('export, invalid import, confirmation and recovery preserve preferences', async ({
  page,
}, info) => {
  await page.goto('/demo/ajustes');
  await expect(page.getByRole('button', { name: 'Exportar cenário' })).toBeVisible();
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!));
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar cenário' }).click();
  const download = await downloadPromise;
  const filePath = info.outputPath('scenario.json');
  await download.saveAs(filePath);
  await page.getByLabel('Arquivo de cenário').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'Arquivo inválido' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!))).toEqual(
    original,
  );
  const modified = structuredClone(original);
  modified.customers[0].name = 'Cliente importado';
  const upload = {
    name: 'scenario.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(modified)),
  };
  await page.getByLabel('Arquivo de cenário').setInputFiles(upload);
  const dialog = page.getByRole('dialog', { name: 'Importar este cenário?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Voltar', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!))).toEqual(
    original,
  );
  const preferences = await page.evaluate(() => localStorage.getItem('patio.preferences.v1'));
  await page.getByLabel('Arquivo de cenário').setInputFiles(upload);
  await dialog.getByRole('button', { name: 'Substituir pelo arquivo' }).click();
  await expect(dialog).not.toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!).customers[0].name),
  ).toBe('Cliente importado');
  expect(await page.evaluate(() => localStorage.getItem('patio.preferences.v1'))).toBe(preferences);
  await page.getByLabel('Arquivo de cenário').setInputFiles(filePath);
  await dialog.getByRole('button', { name: 'Substituir pelo arquivo' }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!).customers),
  ).toEqual(original.customers);
});

test('import recovers corrupt storage and refuses an intervening change from another tab', async ({
  page,
  context,
}) => {
  await page.goto('/demo/ajustes');
  await expect(page.getByRole('button', { name: 'Exportar cenário' })).toBeVisible();
  const raw = await page.evaluate(() => localStorage.getItem('patio.demo.v1')!);
  const upload = { name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(raw) };
  await page.evaluate(() => localStorage.setItem('patio.demo.v1', '{broken'));
  await page.reload();
  await expect(page.locator('.error-banner')).toContainText('Nada foi sobrescrito');
  await page.getByLabel('Arquivo de cenário').setInputFiles(upload);
  await page.getByRole('button', { name: 'Substituir pelo arquivo' }).click();
  await expect(page.locator('.error-banner')).toHaveCount(0);
  await page.getByLabel('Arquivo de cenário').setInputFiles(upload);
  const other = await context.newPage();
  await other.goto('/demo/ordens/nova');
  await other.getByLabel('Nome do cliente').fill('Outra aba');
  await page.getByRole('button', { name: 'Substituir pelo arquivo' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('outra aba');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('patio.demo.v1')!).draft.name),
  ).toBe('Outra aba');
  await other.close();
});

test('public entry, metadata, share image and invalid routes work', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator('.order-card')).toHaveCount(6);
  await expect(page).toHaveTitle('Visão do pátio · Pátio');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(errors).toEqual([]);
  const image = await request.get('/opengraph-image');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/png');
  await page.goto('/demo/ordens/1042/rota-invalida');
  await expect(
    page.getByRole('heading', { name: 'Este caminho não leva ao pátio.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à operação' }).click();
  await expect(page.locator('.order-card')).toHaveCount(6);
});
