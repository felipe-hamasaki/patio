import { describe, expect, it } from 'vitest';
import { seed } from '../../src/lib/seed';
import {
  balance,
  createOrder,
  latestQuote,
  lineTotal,
  quoteTotal,
  stateSchema,
  transition,
  type Draft,
  type Order,
} from '../../src/lib/domain';

const approval = () => seed().orders[0];
const accepted = () => {
  const o = approval();
  return transition(o, {
    type: 'decide',
    version: 1,
    accepted: latestQuote(o)!.items.map((i) => i.id),
  });
};
const complete = (): Order => {
  let o = accepted();
  for (const id of latestQuote(o)!.accepted)
    o = transition(o, { type: 'task', itemId: id, done: true });
  for (const index of [0, 1]) o = transition(o, { type: 'check', index, done: true, final: true });
  return transition(o, { type: 'ready' });
};
describe('money and approvals', () => {
  it('calculates integer cents with fractional quantities, rounding once per line', () =>
    expect(
      lineTotal({ id: 'x', name: 'Óleo', kind: 'part', quantity: 125, price: 999, discount: 49 }),
    ).toBe(1200));
  it('refuses discounts greater than line value', () =>
    expect(() =>
      transition(approval(), {
        type: 'quote',
        items: [
          { id: 'x', name: 'Serviço', kind: 'labor', quantity: 100, price: 100, discount: 101 },
        ],
      }),
    ).toThrow());
  it('limits execution and total to the accepted items', () => {
    const o = transition(approval(), { type: 'decide', version: 1, accepted: ['item0-0'] });
    expect(quoteTotal(latestQuote(o), true)).toBe(28000);
    expect(o.stage).toBe('execution');
    expect(() => transition(o, { type: 'task', itemId: 'item0-1', done: true })).toThrow(
      /aprovados/,
    );
  });
  it('rejects stale approval and repeated decisions', () => {
    expect(() =>
      transition(approval(), { type: 'decide', version: 2, accepted: ['item0-0'] }),
    ).toThrow();
    expect(() =>
      transition(accepted(), { type: 'decide', version: 1, accepted: ['item0-0'] }),
    ).toThrow();
  });
  it('rejects duplicate or unknown accepted identifiers', () => {
    for (const ids of [['unknown'], ['item0-0', 'item0-0']])
      expect(() => transition(approval(), { type: 'decide', version: 1, accepted: ids })).toThrow();
  });
  it('records refusal without losing the version', () => {
    const o = transition(approval(), { type: 'decide', version: 1, accepted: [] });
    expect(o.stage).toBe('diagnosis');
    expect(latestQuote(o)?.status).toBe('rejected');
    expect(() => transition(o, { type: 'submit' })).toThrow();
  });
  it('keeps the previous approved version and requires new approval on revision', () => {
    const source = accepted();
    const o = transition(source, {
      type: 'quote',
      items: latestQuote(source)!.items.map((i) => ({ ...i, price: i.price + 500 })),
    });
    expect(o.quotes[0].status).toBe('approved');
    expect(o.quotes[1].status).toBe('draft');
    expect(o.quotes[1].accepted).toEqual([]);
    expect(o.stage).toBe('diagnosis');
    expect(source.quotes).toHaveLength(1);
  });
  it('locks revisions after execution or receiving money', () => {
    for (const o of [
      transition(accepted(), { type: 'task', itemId: 'item0-0', done: true }),
      transition(accepted(), { type: 'payment', id: 'p', amount: 100, method: 'Pix' }),
    ])
      expect(() => transition(o, { type: 'quote', items: latestQuote(o)!.items })).toThrow();
  });
});
describe('operational flow', () => {
  it('requires entry checklist before submitting', () => {
    let o = seed().orders[2];
    o = transition(o, { type: 'quote', items: latestQuote(approval())!.items });
    expect(() => transition(o, { type: 'submit' })).toThrow(/checklist/);
    o = transition(o, { type: 'check', index: 2, done: true, final: false });
    expect(transition(o, { type: 'submit' }).stage).toBe('approval');
  });
  it('prevents completion without tasks and final checks', () =>
    expect(() => transition(accepted(), { type: 'ready' })).toThrow());
  it('prevents execution while waiting for parts', () => {
    const o = transition(accepted(), { type: 'block', reason: 'Pastilhas' });
    expect(() => transition(o, { type: 'task', itemId: 'item0-0', done: true })).toThrow();
    expect(transition(o, { type: 'block', reason: '' }).blocked).toBe('');
  });
  it('guards checklist indexes and final checks before work', () => {
    expect(() =>
      transition(accepted(), { type: 'check', index: 0, done: true, final: true }),
    ).toThrow();
    expect(() =>
      transition(accepted(), { type: 'check', index: -1, done: true, final: true }),
    ).toThrow();
  });
  it('delivers only after completion and an explicit reason for debt', () => {
    expect(() => transition(accepted(), { type: 'deliver', reason: 'Combinado' })).toThrow();
    expect(() => transition(complete(), { type: 'deliver', reason: '' })).toThrow();
    const o = transition(complete(), { type: 'deliver', reason: 'Cliente pagará amanhã' });
    expect(o.stage).toBe('delivered');
    expect(balance(o)).toBe(52500);
  });
  it('closes delivery without a debt reason after full receipt', () => {
    let o = complete();
    o = transition(o, { type: 'payment', id: 'p', amount: balance(o), method: 'Pix' });
    expect(transition(o, { type: 'deliver', reason: '' }).stage).toBe('delivered');
  });
  it('preserves history on cancellation and disallows work afterward', () => {
    const o = transition(approval(), { type: 'cancel', reason: 'Cliente desistiu' });
    expect(o.quotes).toHaveLength(1);
    expect(o.events.at(-1)?.description).toContain('Cliente desistiu');
    expect(() => transition(o, { type: 'submit' })).toThrow();
  });
});
describe('receipts', () => {
  it('rejects zero, negative, fractional and excess receipts', () => {
    for (const amount of [0, -1, 0.5, 60000])
      expect(() =>
        transition(accepted(), { type: 'payment', id: 'p', amount, method: 'Pix' }),
      ).toThrow();
  });
  it('does not allow payment before approval', () =>
    expect(() =>
      transition(approval(), { type: 'payment', id: 'p', amount: 100, method: 'Pix' }),
    ).toThrow());
  it('is idempotent for the same receipt id', () => {
    const action = { type: 'payment', id: 'p', amount: 20000, method: 'Pix' } as const;
    const o = transition(accepted(), action);
    expect(transition(o, action)).toEqual(o);
    expect(balance(o)).toBe(32500);
  });
  it('allows settlement after delivery without reopening work', () => {
    let o = transition(complete(), { type: 'deliver', reason: 'A prazo combinado' });
    o = transition(o, { type: 'payment', id: 'p', amount: balance(o), method: 'Dinheiro' });
    expect(balance(o)).toBe(0);
    expect(o.stage).toBe('delivered');
  });
});
describe('creation and persistence schema', () => {
  const draft = (): Draft => ({
    customerId: '',
    name: 'Teste Fictício',
    contact: '',
    vehicleId: '',
    model: 'Honda Civic',
    plate: 'TES1A23',
    year: '2022',
    title: 'Revisão',
    report: 'Revisão preventiva',
    mileage: '15000',
    tech: 'Camila',
    due: new Date().toISOString(),
    checks: [false, false, false, false],
  });
  it('creates linked entities and sequential OS, removing saved draft', () => {
    const s = createOrder(seed(), draft());
    expect(s.orders[0].number).toBe(1048);
    expect(s.customers).toHaveLength(7);
    expect(s.vehicles.find((v) => v.id === s.orders[0].vehicleId)?.customerId).toBe(
      s.orders[0].customerId,
    );
    expect(s.draft).toBe(null);
  });
  it('allows another vehicle for an existing customer', () => {
    const s = createOrder(seed(), { ...draft(), customerId: 'c0' });
    expect(s.customers).toHaveLength(6);
    expect(s.vehicles.filter((v) => v.customerId === 'c0')).toHaveLength(2);
  });
  it('refuses duplicate plate and two active OS on a vehicle', () => {
    expect(() => createOrder(seed(), { ...draft(), plate: 'DEM0A20' })).toThrow(/placa/);
    expect(() => createOrder(seed(), { ...draft(), customerId: 'c0', vehicleId: 'v0' })).toThrow(
      /andamento/,
    );
  });
  it('refuses missing mileage, mismatched ownership and malformed storage', () => {
    expect(() => createOrder(seed(), { ...draft(), mileage: '' })).toThrow();
    expect(() => createOrder(seed(), { ...draft(), customerId: 'c0', vehicleId: 'v1' })).toThrow();
    const s = seed();
    s.vehicles[0].customerId = 'missing';
    expect(stateSchema.safeParse(s).success).toBe(false);
    expect(stateSchema.safeParse({ schema: 5 }).success).toBe(false);
  });
});
