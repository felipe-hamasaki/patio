import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function openOrder(page: Page, number: number) {
  await page.goto(`/demo/ordens/${number}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
async function tab(page: Page, name: string) {
  await page.getByRole('tab', { name, exact: true }).click();
}
test('new OS, draft, quote, partial approval, execution, payment and delivery survive reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo/ordens/nova');
  await page.getByLabel('Nome do cliente').fill('Fernanda Exemplo');
  await page.reload();
  await expect(page.getByLabel('Nome do cliente')).toHaveValue('Fernanda Exemplo');
  await page.getByLabel('Modelo', { exact: false }).fill('Honda Civic');
  await page.getByLabel('Placa fictícia').fill('TES1A23');
  await page.getByLabel('Quilometragem').fill('42000');
  await page.getByLabel('Resumo do serviço').fill('Revisão preventiva');
  await page.getByLabel('Relato do cliente').fill('Veículo com ruído ao frear.');
  for (const label of [
    'Lataria e pintura conferidas',
    'Objetos pessoais conferidos',
    'Painel e luzes registrados',
    'Combustível conferido',
  ])
    await page.getByLabel(label).check();
  await page.getByRole('button', { name: 'Criar ordem de serviço' }).click();
  await expect(page.getByRole('heading', { name: 'Honda Civic' })).toBeVisible();
  await page.getByRole('button', { name: 'Montar orçamento' }).click();
  await page.getByLabel('Descrição do item 1').fill('Pastilha de freio');
  await page.getByLabel('Preço do item 1').fill('280,50');
  await page.getByLabel('Desconto do item 1').fill('10,50');
  await page.getByRole('button', { name: 'Adicionar item', exact: true }).click();
  await page.getByLabel('Descrição do item 2').fill('Revisão opcional');
  await page.getByLabel('Preço do item 2').fill('180');
  await page.getByRole('button', { name: 'Salvar versão 1' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
  await page.getByRole('button', { name: 'Simular aprovação', exact: true }).click();
  await page.getByRole('checkbox', { name: /Revisão opcional/ }).uncheck();
  await page.getByRole('button', { name: 'Aprovar itens selecionados' }).click();
  await tab(page, 'Execução');
  await expect(page.getByRole('checkbox', { name: /Revisão opcional/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Concluir execução' }).click();
  await expect(
    page
      .getByText('Conclua os serviços aprovados e as duas conferências; resolva bloqueios de peça.')
      .first(),
  ).toBeVisible();
  await page.getByRole('checkbox', { name: /Pastilha de freio/ }).check();
  await page.getByLabel('Teste de funcionamento concluído').check();
  await page.getByLabel('Veículo e itens conferidos para retirada').check();
  await page.getByRole('button', { name: 'Concluir execução' }).click();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('motivo');
  await page.getByRole('dialog').getByRole('button', { name: 'Voltar', exact: true }).click();
  await tab(page, 'Recebimentos');
  await page.getByRole('button', { name: 'Registrar recebimento', exact: true }).click();
  await expect(page.getByLabel('Valor (R$)', { exact: true })).toHaveValue('270.00');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Confirmar recebimento fictício' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('saldo pendente');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('270');
  await page.getByRole('button', { name: 'Confirmar recebimento fictício' }).click();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await page.reload();
  await expect(page.locator('.detail-heading .badge')).toHaveText('Entregues');
  await tab(page, 'Histórico');
  await expect(page.getByText('Veículo entregue. Saldo quitado.')).toBeVisible();
  expect(errors).toEqual([]);
});
test('revision preserves accepted history and refusal returns to diagnosis', async ({ page }) => {
  await openOrder(page, 1042);
  await page.getByRole('button', { name: 'Simular aprovação', exact: true }).click();
  await page.getByRole('button', { name: 'Aprovar todos os itens' }).click();
  await page.getByRole('button', { name: 'Revisar orçamento' }).click();
  await page.getByLabel('Preço do item 1').fill('300');
  await page.getByRole('button', { name: 'Salvar versão 2' }).click();
  await expect(page.locator('.detail-heading .badge')).toHaveText('Diagnóstico');
  await page.getByLabel('Versão do orçamento').selectOption('1');
  await expect(page.getByText('Decisão simulada registrada', { exact: false })).toBeVisible();
  await page.getByLabel('Versão do orçamento').selectOption('2');
  await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
  await page.getByRole('button', { name: 'Simular aprovação', exact: true }).click();
  await page.getByRole('button', { name: 'Recusar orçamento' }).click();
  await expect(page.getByText('O cliente recusou todos os itens.', { exact: false })).toBeVisible();
});
test('search, list, filters, empty result and restored seed', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('radio', { name: 'Lista', exact: true }).click();
  await page.getByLabel('Buscar ordens de serviço').fill('Marina');
  await expect(page.locator('.list-row')).toHaveCount(1);
  await page.getByLabel('Buscar ordens de serviço').fill('NãoExiste');
  await expect(page.getByRole('heading', { name: 'Nenhuma OS por aqui.' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.getByLabel('Filtrar por responsável').selectOption('Rafael');
  await expect(page.locator('.list-row')).toHaveCount(3);
  await page.goto('/demo/ajustes');
  await page.locator('main').getByRole('button', { name: 'Restaurar cenário' }).click();
  await page.getByRole('button', { name: 'Restaurar demonstração' }).click();
  await expect(page.locator('.order-card')).toHaveCount(6);
});
test('blocked execution, simulated storage failure and retry retain quote fields', async ({
  page,
}) => {
  await openOrder(page, 1047);
  await tab(page, 'Execução');
  await expect(page.getByRole('checkbox', { name: /Mangueira e aditivo/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Registrar chegada' }).click();
  await expect(page.getByRole('checkbox', { name: /Mangueira e aditivo/ })).toBeEnabled();
  await page.goto('/demo/ajustes');
  await page.getByRole('button', { name: 'Simular falha na próxima gravação' }).click();
  // Client navigation keeps the failure switch active within the mounted store.
  if (await page.getByRole('button', { name: 'Abrir navegação' }).isVisible())
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await page.getByRole('link', { name: /^Ordens de serviço/ }).click();
  await page.getByRole('link', { name: 'Abrir OS 1042, Honda Fit' }).click();
  await page.getByRole('button', { name: 'Revisar orçamento' }).click();
  await page.getByLabel('Preço do item 1').fill('321');
  await page.getByRole('button', { name: 'Salvar versão 2' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Falha de gravação simulada',
  );
  await expect(page.getByLabel('Preço do item 1')).toHaveValue('321');
  await page.getByRole('button', { name: 'Salvar versão 2' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('invalid storage is recoverable without silently overwriting it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('patio.demo.v1', '{invalid'));
  await page.goto('/demo');
  await expect(page.locator('.error-banner')).toContainText('Nada foi sobrescrito');
  expect(await page.evaluate(() => localStorage.getItem('patio.demo.v1'))).toBe('{invalid');
  await page.getByRole('button', { name: 'Restaurar demo', exact: true }).click();
  await page.getByRole('button', { name: 'Restaurar demonstração' }).click();
  await expect(page.locator('.order-card')).toHaveCount(6);
  await expect(page.locator('.error-banner')).toHaveCount(0);
});
test('responsive layout, keyboard modal and accessibility', async ({ page }, testInfo) => {
  await page.goto('/demo');
  await expect(page.locator('.order-card')).toHaveCount(6);
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-operacao.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.getByRole('button', { name: 'Ajuda da demonstração' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await openOrder(page, 1042);
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-orcamento.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Simular aprovação', exact: true }).click();
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-aprovacao.png`,
    animations: 'disabled',
  });
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
});
