import { describe, expect, it } from 'vitest';
import { seed } from '../../src/lib/seed';
import { parseBackup, saveCustomer, saveVehicle, type State } from '../../src/lib/domain';

describe('scenario recovery', () => {
  it('round-trips the exported scenario, including history and payments', () => {
    const state = seed();
    expect(parseBackup(JSON.stringify(state))).toEqual(state);
  });
  it('rejects malformed, oversized and incompatible files', () => {
    for (const raw of ['{broken', 'null', '{}', JSON.stringify({ ...seed(), schema: 2 })])
      expect(() => parseBackup(raw)).toThrow(/inválido ou incompatível/);
    expect(() => parseBackup(' '.repeat(2 * 1024 * 1024 + 1))).toThrow(/2 MB/);
  });
  it.each<[string, (s: State) => void]>([
    [
      'orphan vehicle',
      (s) => {
        s.vehicles[0].customerId = 'unknown';
      },
    ],
    [
      'duplicate plate',
      (s) => {
        s.vehicles[1].plate = s.vehicles[0].plate;
      },
    ],
    [
      'duplicate order number',
      (s) => {
        s.orders[1].number = s.orders[0].number;
      },
    ],
    [
      'duplicate payment',
      (s) => {
        s.orders[4].payments.push(s.orders[4].payments[0]);
      },
    ],
    [
      'overpayment',
      (s) => {
        s.orders[4].payments[0].amount = 100_000_000;
      },
    ],
    [
      'unapproved execution',
      (s) => {
        s.orders[0].stage = 'execution';
      },
    ],
    [
      'unapproved completed task',
      (s) => {
        s.orders[1].completed.push('unknown');
      },
    ],
    [
      'duplicate approval',
      (s) => {
        s.orders[1].quotes[0].accepted.push(s.orders[1].quotes[0].accepted[0]);
      },
    ],
    [
      'invalid quote date',
      (s) => {
        s.orders[0].quotes[0].createdAt = 'yesterday';
      },
    ],
    [
      'missing inspection',
      (s) => {
        s.orders[4].finalChecks[0] = false;
      },
    ],
    [
      'duplicate active visit',
      (s) => {
        s.orders.push({ ...s.orders[0], id: 'new', number: 9999 });
      },
    ],
  ])('rejects %s before it can replace the scenario', (_, change) => {
    const state = seed();
    change(state);
    expect(() => parseBackup(JSON.stringify(state))).toThrow(/inválido ou incompatível/);
  });
});

describe('customer and vehicle registration', () => {
  it('edits a customer without losing their orders or changing the source', () => {
    const state = seed();
    const customer = state.customers[0];
    const result = saveCustomer(state, { ...customer, name: 'Nome corrigido' }, customer);
    expect(result.customers[0].name).toBe('Nome corrigido');
    expect(result.orders).toEqual(state.orders);
    expect(state.customers[0]).toEqual(customer);
  });
  it('adds a vehicle independently and normalizes its plate', () => {
    const result = saveVehicle(seed(), {
      id: 'new',
      customerId: 'c0',
      model: 'Civic',
      plate: 'tes-1234',
      year: 2020,
    });
    expect(result.vehicles.at(-1)?.plate).toBe('TES1234');
    expect(result.orders).toHaveLength(6);
  });
  it('rejects duplicate plates and ownership changes', () => {
    const state = seed();
    expect(() => saveVehicle(state, { ...state.vehicles[0], id: 'new' })).toThrow(/placa/);
    expect(() =>
      saveVehicle(state, { ...state.vehicles[0], customerId: 'c1' }, state.vehicles[0]),
    ).toThrow(/pertencer/);
  });
  it('rejects stale customer and vehicle edits from another tab', () => {
    const state = seed();
    const customer = structuredClone(state.customers[0]);
    const vehicle = structuredClone(state.vehicles[0]);
    state.customers[0].contact = 'alterado';
    state.vehicles[0].year = 2024;
    expect(() => saveCustomer(state, customer, customer)).toThrow(/outra aba/);
    expect(() => saveVehicle(state, vehicle, vehicle)).toThrow(/outra aba/);
  });
});
