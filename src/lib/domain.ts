import { z } from 'zod';

const text = z.string().trim().min(1).max(300);
const cents = z.number().int().min(0).max(100_000_000);
export const itemSchema = z
  .object({
    id: text,
    name: text,
    kind: z.enum(['part', 'labor']),
    quantity: z.number().int().min(1).max(100_000),
    price: cents,
    discount: cents,
  })
  .refine(
    (i) => i.discount <= Math.round((i.quantity * i.price) / 100),
    'O desconto excede o valor do item.',
  );
export const quoteSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(itemSchema).min(1).max(50),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']),
  accepted: z.array(z.string()),
  createdAt: z.string().datetime(),
  decidedAt: z.string().datetime().optional(),
});
export const customerSchema = z.object({
  id: text,
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().max(100),
});
export const vehicleSchema = z.object({
  id: text,
  customerId: text,
  model: text,
  plate: z
    .string()
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Use uma placa no formato ABC1D23 ou ABC1234.'),
  year: z.number().int().min(1950).max(2100),
});
export const stageLabels = {
  diagnosis: 'Diagnóstico',
  approval: 'Aprovação',
  execution: 'Em execução',
  ready: 'Prontos',
  delivered: 'Entregues',
  cancelled: 'Canceladas',
} as const;
export type Stage = keyof typeof stageLabels;
export const checklistLabels = [
  'Lataria e pintura conferidas',
  'Objetos pessoais conferidos',
  'Painel e luzes registrados',
  'Combustível conferido',
];
export const orderSchema = z.object({
  id: text,
  number: z.number().int().positive(),
  customerId: text,
  vehicleId: text,
  stage: z.enum(['diagnosis', 'approval', 'execution', 'ready', 'delivered', 'cancelled']),
  title: text,
  report: text,
  mileage: z.number().int().min(0).max(2_000_000),
  tech: z.enum(['Rafael', 'Bruno', 'Camila']),
  due: z.string().datetime(),
  createdAt: z.string().datetime(),
  checks: z.array(z.boolean()).length(4),
  photos: z.array(z.enum(['front', 'panel'])),
  quotes: z.array(quoteSchema),
  completed: z.array(z.string()),
  finalChecks: z.array(z.boolean()).length(2),
  blocked: z.string().max(300),
  payments: z.array(
    z.object({
      id: text,
      amount: cents.refine((n) => n > 0),
      method: z.enum(['Pix', 'Dinheiro', 'Cartão']),
      at: z.string().datetime(),
    }),
  ),
  events: z.array(z.object({ id: text, at: z.string().datetime(), description: text })),
  deliveryReason: z.string().max(300),
});
export const draftSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  contact: z.string(),
  vehicleId: z.string(),
  model: z.string(),
  plate: z.string(),
  year: z.string(),
  title: z.string(),
  report: z.string(),
  mileage: z.string(),
  tech: z.enum(['Rafael', 'Bruno', 'Camila']),
  due: z.string(),
  checks: z.array(z.boolean()).length(4),
});
export const stateSchema = z
  .object({
    schema: z.literal(1),
    revision: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER - 1),
    customers: z.array(customerSchema),
    vehicles: z.array(vehicleSchema),
    orders: z.array(orderSchema),
    draft: draftSchema.nullable(),
  })
  .superRefine((s, ctx) => {
    const error = () =>
      ctx.addIssue({ code: 'custom', message: 'Os vínculos do cenário estão inválidos.' });
    for (const group of [s.customers, s.vehicles, s.orders])
      if (new Set(group.map((x) => x.id)).size !== group.length) error();
    if (new Set(s.vehicles.map((v) => v.plate)).size !== s.vehicles.length) error();
    if (new Set(s.orders.map((o) => o.number)).size !== s.orders.length) error();
    for (const v of s.vehicles) if (!s.customers.some((c) => c.id === v.customerId)) error();
    for (const o of s.orders) {
      if (!s.vehicles.some((v) => v.id === o.vehicleId && v.customerId === o.customerId)) error();
      for (const [index, q] of o.quotes.entries())
        if (
          q.version !== index + 1 ||
          new Set(q.items.map((i) => i.id)).size !== q.items.length ||
          new Set(q.accepted).size !== q.accepted.length ||
          q.accepted.some((id) => !q.items.some((i) => i.id === id)) ||
          (q.status === 'approved' ? !q.accepted.length : !!q.accepted.length) ||
          (['approved', 'rejected'].includes(q.status) && !q.decidedAt)
        )
          error();
      const q = o.quotes.at(-1);
      if (
        (['execution', 'ready', 'delivered'].includes(o.stage) && q?.status !== 'approved') ||
        (o.stage === 'approval' && q?.status !== 'pending') ||
        (o.stage === 'diagnosis' && q && !['draft', 'rejected'].includes(q.status)) ||
        (o.payments.length && q?.status !== 'approved') ||
        new Set(o.payments.map((p) => p.id)).size !== o.payments.length ||
        new Set(o.completed).size !== o.completed.length ||
        o.completed.some((id) => !q?.accepted.includes(id)) ||
        o.payments.reduce((sum, p) => sum + p.amount, 0) >
          (q?.items
            .filter((i) => q.accepted.includes(i.id))
            .reduce((sum, i) => sum + Math.round((i.quantity * i.price) / 100) - i.discount, 0) ??
            0) ||
        (['ready', 'delivered'].includes(o.stage) &&
          (!!o.blocked ||
            !o.finalChecks.every(Boolean) ||
            q?.accepted.some((id) => !o.completed.includes(id))))
      )
        error();
    }
    const active = s.orders.filter((o) => !['delivered', 'cancelled'].includes(o.stage));
    if (new Set(active.map((o) => o.vehicleId)).size !== active.length) error();
  });
export type Item = z.infer<typeof itemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type Draft = z.infer<typeof draftSchema>;
export type State = z.infer<typeof stateSchema>;
export const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n / 100);
export const lineTotal = (i: Item) => Math.round((i.quantity * i.price) / 100) - i.discount;
export const latestQuote = (o: Order) => o.quotes.at(-1);
export const quoteTotal = (q?: Quote, acceptedOnly = false) =>
  q?.items
    .filter((i) => !acceptedOnly || q.accepted.includes(i.id))
    .reduce((n, i) => n + lineTotal(i), 0) ?? 0;
export const paid = (o: Order) => o.payments.reduce((n, p) => n + p.amount, 0);
export const balance = (o: Order) => quoteTotal(latestQuote(o), true) - paid(o);
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const isLate = (o: Order, now = Date.now()) =>
  !['delivered', 'cancelled'].includes(o.stage) && new Date(o.due).getTime() < now;
export const dateTime = (s: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(s));
export const uid = () => crypto.randomUUID();

/** Local recovery files use the same validation boundary as live changes. */
export function parseBackup(raw: string): State {
  if (new TextEncoder().encode(raw).length > 2 * 1024 * 1024)
    throw new Error('Use um arquivo de cenário de até 2 MB.');
  try {
    return stateSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error('Arquivo inválido ou incompatível. Escolha um cenário exportado pelo Pátio.');
  }
}

export function saveCustomer(s: State, customer: Customer, original?: Customer): State {
  const next = structuredClone(s);
  const parsed = customerSchema.parse(customer);
  const index = next.customers.findIndex((c) => c.id === parsed.id);
  if (original) {
    requireRule(
      index >= 0 && JSON.stringify(next.customers[index]) === JSON.stringify(original),
      'Este cadastro mudou em outra aba. Feche e abra novamente para editar.',
    );
    next.customers[index] = parsed;
  } else {
    requireRule(index < 0, 'Este cliente já está cadastrado.');
    next.customers.push(parsed);
  }
  return stateSchema.parse(next);
}

export function saveVehicle(s: State, vehicle: Vehicle, original?: Vehicle): State {
  const next = structuredClone(s);
  const parsed = vehicleSchema.parse({
    ...vehicle,
    plate: vehicle.plate.toUpperCase().replace(/[-\s]/g, ''),
  });
  requireRule(
    next.customers.some((c) => c.id === parsed.customerId),
    'Selecione um cliente válido.',
  );
  requireRule(
    !next.vehicles.some((v) => v.plate === parsed.plate && v.id !== parsed.id),
    'Esta placa já está cadastrada. Selecione o cliente e o veículo existentes.',
  );
  const index = next.vehicles.findIndex((v) => v.id === parsed.id);
  if (original) {
    requireRule(
      index >= 0 && JSON.stringify(next.vehicles[index]) === JSON.stringify(original),
      'Este cadastro mudou em outra aba. Feche e abra novamente para editar.',
    );
    requireRule(
      parsed.customerId === original.customerId,
      'O veículo precisa pertencer ao cliente selecionado.',
    );
    next.vehicles[index] = parsed;
  } else {
    requireRule(index < 0, 'Este veículo já está cadastrado.');
    next.vehicles.push(parsed);
  }
  return stateSchema.parse(next);
}
export function event(o: Order, description: string) {
  o.events.push({ id: uid(), at: new Date().toISOString(), description });
}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export type Action =
  | { type: 'quote'; items: Item[] }
  | { type: 'submit' }
  | { type: 'decide'; version: number; accepted: string[] }
  | { type: 'task'; itemId: string; done: boolean }
  | { type: 'block'; reason: string }
  | { type: 'check'; index: number; done: boolean; final: boolean }
  | { type: 'photo'; photo: 'front' | 'panel' }
  | { type: 'ready' }
  | { type: 'deliver'; reason: string }
  | { type: 'payment'; id: string; amount: number; method: 'Pix' | 'Dinheiro' | 'Cartão' }
  | { type: 'metadata'; tech: Order['tech']; due: string }
  | { type: 'cancel'; reason: string };

/** Pure transition boundary. The UI cannot bypass approval or completion guards. */
export function transition(source: Order, action: Action): Order {
  const o = structuredClone(source),
    q = latestQuote(o);
  if (action.type === 'payment') {
    if (o.payments.some((p) => p.id === action.id)) return o;
    requireRule(
      q?.status === 'approved' && o.stage !== 'cancelled',
      'Aprove um orçamento antes de registrar recebimentos.',
    );
    requireRule(
      Number.isInteger(action.amount) && action.amount > 0 && action.amount <= balance(o),
      'Informe um valor maior que zero e até o saldo pendente.',
    );
    o.payments.push({
      id: action.id,
      amount: action.amount,
      method: action.method,
      at: new Date().toISOString(),
    });
    event(o, `Recebimento fictício: ${money(action.amount)} em ${action.method}.`);
  } else {
    requireRule(
      !['delivered', 'cancelled'].includes(o.stage),
      'Esta OS está encerrada. O histórico continua disponível.',
    );
    switch (action.type) {
      case 'quote': {
        requireRule(
          o.stage !== 'ready' && !o.completed.length && !o.payments.length,
          'A revisão só é permitida antes de executar itens ou receber valores.',
        );
        const items = z
          .array(itemSchema)
          .min(1, 'Adicione ao menos um item.')
          .max(50)
          .parse(action.items);
        requireRule(
          new Set(items.map((i) => i.id)).size === items.length,
          'Os itens precisam ter identificadores únicos.',
        );
        o.quotes.push({
          version: (q?.version ?? 0) + 1,
          items,
          status: 'draft',
          accepted: [],
          createdAt: new Date().toISOString(),
        });
        o.stage = 'diagnosis';
        o.completed = [];
        o.finalChecks = [false, false];
        event(o, `Orçamento v${o.quotes.length} salvo. Nova aprovação necessária.`);
        break;
      }
      case 'submit':
        requireRule(
          q?.status === 'draft' && o.stage === 'diagnosis',
          'Salve uma nova versão do orçamento antes de enviar.',
        );
        requireRule(
          o.checks.every(Boolean),
          'Conclua os quatro itens do checklist de entrada antes de enviar o orçamento.',
        );
        q.status = 'pending';
        o.stage = 'approval';
        event(o, `Orçamento v${q.version} enviado para aprovação simulada.`);
        break;
      case 'decide': {
        requireRule(
          q?.version === action.version && q.status === 'pending' && o.stage === 'approval',
          'Esta versão já foi decidida ou substituída. Reabra o orçamento atual.',
        );
        requireRule(
          new Set(action.accepted).size === action.accepted.length &&
            action.accepted.every((id) => q.items.some((i) => i.id === id)),
          'A seleção contém itens inválidos.',
        );
        q.accepted = action.accepted;
        q.status = action.accepted.length ? 'approved' : 'rejected';
        q.decidedAt = new Date().toISOString();
        o.stage = action.accepted.length ? 'execution' : 'diagnosis';
        event(
          o,
          action.accepted.length
            ? `Aprovação simulada da v${q.version}: ${action.accepted.length} de ${q.items.length} itens.`
            : `Orçamento v${q.version} recusado na simulação.`,
        );
        break;
      }
      case 'task':
        requireRule(
          o.stage === 'execution' && !o.blocked,
          'A execução precisa estar liberada, sem pendência de peça.',
        );
        requireRule(
          q?.status === 'approved' && q.accepted.includes(action.itemId),
          'Somente itens aprovados podem ser executados.',
        );
        o.completed = action.done
          ? [...new Set([...o.completed, action.itemId])]
          : o.completed.filter((id) => id !== action.itemId);
        o.finalChecks = [false, false];
        event(
          o,
          `${action.done ? 'Concluído' : 'Reaberto'}: ${q.items.find((i) => i.id === action.itemId)?.name}.`,
        );
        break;
      case 'block':
        requireRule(o.stage === 'execution', 'Bloqueios de peça se aplicam à execução.');
        o.blocked = action.reason.trim().slice(0, 300);
        event(o, o.blocked ? `Aguardando peça: ${o.blocked}` : 'Peça recebida. Execução liberada.');
        break;
      case 'check':
        requireRule(
          Number.isInteger(action.index) &&
            action.index >= 0 &&
            action.index < (action.final ? 2 : 4),
          'Item de checklist inválido.',
        );
        requireRule(
          action.final
            ? o.stage === 'execution' &&
                !o.blocked &&
                !!q?.accepted.length &&
                q.accepted.every((id) => o.completed.includes(id))
            : o.stage === 'diagnosis',
          action.final
            ? 'Conclua os itens aprovados e libere a peça antes da conferência.'
            : 'A entrada só pode ser alterada durante o diagnóstico.',
        );
        (action.final ? o.finalChecks : o.checks)[action.index] = action.done;
        event(o, `${action.final ? 'Conferência final' : 'Checklist de entrada'} atualizado.`);
        break;
      case 'photo':
        requireRule(o.stage === 'diagnosis', 'Registre imagens durante o diagnóstico.');
        if (!o.photos.includes(action.photo)) {
          o.photos.push(action.photo);
          event(o, 'Imagem ilustrativa de entrada adicionada.');
        }
        break;
      case 'ready':
        requireRule(
          o.stage === 'execution' &&
            !o.blocked &&
            q?.status === 'approved' &&
            q.accepted.length &&
            q.accepted.every((id) => o.completed.includes(id)) &&
            o.finalChecks.every(Boolean),
          'Conclua os serviços aprovados e as duas conferências; resolva bloqueios de peça.',
        );
        o.stage = 'ready';
        event(o, 'Serviços e conferência concluídos. Pronto para retirada.');
        break;
      case 'deliver':
        requireRule(o.stage === 'ready', 'O veículo precisa estar pronto para retirada.');
        requireRule(
          balance(o) === 0 || action.reason.trim().length >= 5,
          'Informe o motivo da entrega com saldo pendente (mínimo de 5 caracteres).',
        );
        o.deliveryReason = action.reason.trim();
        o.stage = 'delivered';
        event(
          o,
          `Veículo entregue.${balance(o) ? ` Saldo pendente autorizado pela gestora da demo: ${o.deliveryReason}` : ' Saldo quitado.'}`,
        );
        break;
      case 'metadata':
        requireRule(Number.isFinite(Date.parse(action.due)), 'Informe uma previsão válida.');
        o.tech = action.tech;
        o.due = action.due;
        event(o, 'Responsável e previsão de entrega atualizados.');
        break;
      case 'cancel':
        requireRule(
          ['diagnosis', 'approval'].includes(o.stage) && !o.payments.length,
          'Cancele apenas atendimentos ainda não executados e sem recebimentos.',
        );
        requireRule(
          action.reason.trim().length >= 5,
          'Informe um motivo com ao menos 5 caracteres.',
        );
        o.stage = 'cancelled';
        event(o, `OS cancelada: ${action.reason.trim()}`);
        break;
    }
  }
  return orderSchema.parse(o);
}

export function createOrder(s: State, draft: Draft): State {
  const n = structuredClone(s);
  let customerId = draft.customerId,
    vehicleId = draft.vehicleId;
  if (!customerId) {
    const c = customerSchema.parse({ id: uid(), name: draft.name, contact: draft.contact });
    n.customers.push(c);
    customerId = c.id;
  }
  requireRule(
    n.customers.some((c) => c.id === customerId),
    'Selecione um cliente válido.',
  );
  if (!vehicleId) {
    const v = vehicleSchema.parse({
      id: uid(),
      customerId,
      model: draft.model,
      plate: draft.plate.toUpperCase().replace(/[-\s]/g, ''),
      year: Number(draft.year),
    });
    requireRule(
      !n.vehicles.some((x) => x.plate === v.plate),
      'Esta placa já está cadastrada. Selecione o cliente e o veículo existentes.',
    );
    n.vehicles.push(v);
    vehicleId = v.id;
  }
  requireRule(
    n.vehicles.some((v) => v.id === vehicleId && v.customerId === customerId),
    'O veículo precisa pertencer ao cliente selecionado.',
  );
  requireRule(
    !n.orders.some(
      (o) => o.vehicleId === vehicleId && !['delivered', 'cancelled'].includes(o.stage),
    ),
    'Este veículo já tem uma OS em andamento. Abra o atendimento existente.',
  );
  requireRule(
    draft.mileage.trim() !== '' && Number.isFinite(Date.parse(draft.due)),
    'Informe a quilometragem e a previsão de entrega.',
  );
  const o = orderSchema.parse({
    id: uid(),
    number: Math.max(1041, ...n.orders.map((o) => o.number)) + 1,
    customerId,
    vehicleId,
    title: draft.title,
    report: draft.report,
    mileage: Number(draft.mileage),
    tech: draft.tech,
    due: new Date(draft.due).toISOString(),
    createdAt: new Date().toISOString(),
    stage: 'diagnosis',
    checks: draft.checks,
    photos: [],
    quotes: [],
    completed: [],
    finalChecks: [false, false],
    blocked: '',
    payments: [],
    events: [],
    deliveryReason: '',
  });
  event(o, 'Veículo recebido. Diagnóstico iniciado.');
  n.orders.unshift(o);
  n.draft = null;
  return stateSchema.parse(n);
}
