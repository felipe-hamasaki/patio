import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, parsePreferences, translate } from '../../src/lib/i18n';
describe('language and theme preferences', () => {
  it('uses a safe default for missing or malformed browser preferences', () => {
    for (const raw of [null, '{broken', 'null', '{"locale":"bad","theme":"pink"}'])
      expect(parsePreferences(raw)).toEqual({ locale: 'pt-BR', theme: 'light' });
    expect(parsePreferences('{"locale":"en-US","theme":"dark"}')).toEqual({
      locale: 'en-US',
      theme: 'dark',
    });
  });
  it('translates UI keys while preserving whitespace and user-entered text', () => {
    expect(translate(' Orçamento ', 'en-US')).toBe(' Quote ');
    expect(translate('Orçamento', 'pt-BR')).toBe('Orçamento');
    expect(translate('Personal service description', 'en-US')).toBe('Personal service description');
    expect(translate('', 'en-US')).toBe('');
  });
  it('interpolates labels without interpreting markup', () => {
    expect(translate('Abrir OS {0}, {1}', 'en-US', { 0: 1042, 1: '<script>car</script>' })).toBe(
      'Open order 1042, <script>car</script>',
    );
  });
  it('renders historical Portuguese event messages without migrating stored data', () => {
    const event = 'Aprovação simulada da v2: 1 de 3 itens.';
    expect(translate(event, 'en-US')).toBe('Simulated approval of v2: 1 of 3 items.');
    expect(translate('Concluído: Jogo de pastilhas de freio.', 'en-US')).toBe(
      'Completed: Brake pad set.',
    );
    expect(translate('Recebimento fictício: R$ 1.234,50 em Dinheiro.', 'en-US')).toBe(
      'Simulated payment: R$1,234.50 by Cash.',
    );
    expect(event).toBe('Aprovação simulada da v2: 1 de 3 itens.');
  });
  it('localizes display without currency conversion or a timezone change', () => {
    expect(formatMoney(52500, 'en-US')).toBe('R$525.00');
    expect(formatMoney(52500, 'pt-BR')).toContain('525,00');
    expect(formatDate('2026-10-04T18:00:00Z', 'en-US')).toContain('03:00');
    expect(formatDate('2026-10-04T18:00:00Z', 'pt-BR')).toContain('15:00');
  });
});
