'use client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { NativeSelectOption } from '@/components/ui/native-select';
import { Alert } from '@/components/ui/alert';
import { Table } from '@/components/ui/table';
import { TableHeader } from '@/components/ui/table';
import { TableRow } from '@/components/ui/table';
import { TableHead } from '@/components/ui/table';
import { TableBody } from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge as UiBadge } from '@/components/ui/badge';
import { usePreferences } from '@/lib/preferences';
import { useState } from 'react';
import {
  Plus,
  Pencil,
  Send,
  Printer,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  type Order,
  type Item,
  type Quote,
  latestQuote,
  lineTotal,
  quoteTotal,
  uid,
} from '@/lib/domain';
import { useDemo, orderContext } from '@/lib/demo-store';
import { Modal, Empty, Check } from '@/components/patio-ui';

export function QuotePanel({ order }: { order: Order }) {
  const { tr, money, dateTime } = usePreferences();

  const { act, notify, error } = useDemo();
  const [edit, setEdit] = useState(false),
    [portal, setPortal] = useState(false),
    [print, setPrint] = useState(false);
  const [version, setVersion] = useState<number | null>(null);
  const current = latestQuote(order),
    quote = order.quotes.find((q) => q.version === version) ?? current;
  const canEdit =
    !['ready', 'delivered', 'cancelled'].includes(order.stage) &&
    !order.completed.length &&
    !order.payments.length;
  return (
    <Card className="min-w-0 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>{tr('Clareza em cada item')}</h2>
          <p>{tr('Peças e serviços, com valores sem surpresa.')}</p>
        </div>
        {canEdit && (
          <Button
            variant="outline"
            data-modal-return
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setEdit(true)}
          >
            <Pencil size={15} />
            {current ? tr('Revisar orçamento') : tr('Montar orçamento')}
          </Button>
        )}
      </div>
      {!quote ? (
        <Empty
          title={canEdit ? tr('Vamos dar forma ao orçamento?') : tr('Nenhum orçamento registrado.')}
          description={
            canEdit
              ? tr('Adicione peças, mão de obra e eventuais descontos.')
              : tr('Este atendimento foi encerrado sem orçamento.')
          }
          action={
            canEdit && (
              <Button
                variant="default"
                className="h-auto min-h-9 whitespace-normal"
                onClick={() => setEdit(true)}
              >
                <Plus size={16} />
                {tr('Adicionar primeiro item')}
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 [&>div]:flex [&>div]:flex-wrap [&>div]:items-center [&>div]:gap-2">
            <div>
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted">
                <FileText size={18} />
              </span>
              <strong>
                {tr('Orçamento v')}
                {quote.version}
              </strong>
              <UiBadge variant="secondary">
                {
                  {
                    draft: tr('Rascunho'),
                    pending: tr('Aguardando cliente'),
                    approved: tr('Aprovado'),
                    rejected: tr('Recusado'),
                  }[quote.status]
                }
              </UiBadge>
            </div>
            <NativeSelect
              className="w-full"
              aria-label={tr('Versão do orçamento')}
              value={quote.version}
              onChange={(e) => setVersion(Number(e.target.value))}
            >
              {order.quotes.map((q) => (
                <NativeSelectOption key={q.version} value={q.version}>
                  {tr('Versão ')}
                  {q.version}
                  {q.version === current?.version ? tr(' · atual') : tr(' · histórico')}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <QuoteTable quote={quote} />
          <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm [&>strong]:text-2xl [&>strong]:font-semibold">
            <span>
              {quote.status === 'approved' ? tr('Total aprovado') : tr('Total do orçamento')}
            </span>
            <strong>{money(quoteTotal(quote, quote.status === 'approved'))}</strong>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground [&>svg]:shrink-0">
            <ShieldCheck size={15} />
            {quote.decidedAt
              ? tr('Decisão simulada registrada em {0}.', { 0: dateTime(quote.decidedAt) })
              : tr('Cada revisão é preservada. Alterações exigem uma nova aprovação.')}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => setPrint(true)}
            >
              <Printer size={16} />
              {tr('Prévia para impressão')}
            </Button>
            {current?.status === 'draft' && order.stage === 'diagnosis' && (
              <Button
                variant="default"
                className="h-auto min-h-9 whitespace-normal"
                onClick={() => {
                  if (act(order.id, { type: 'submit' })) {
                    setVersion(null);
                    notify('Orçamento enviado para a aprovação simulada.');
                  }
                }}
              >
                <Send size={16} />
                {tr('Enviar para aprovação')}
              </Button>
            )}
            {current?.status === 'pending' && order.stage === 'approval' && (
              <Button
                variant="default"
                data-modal-return
                className="h-auto min-h-9 whitespace-normal"
                onClick={() => setPortal(true)}
              >
                {tr('Simular aprovação')}
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
          {current?.status === 'rejected' && (
            <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
              {tr(
                'O cliente recusou todos os itens. Revise o orçamento ou cancele o atendimento na aba Entrada.',
              )}
            </Alert>
          )}
          {current?.status === 'draft' && !order.checks.every(Boolean) && (
            <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
              {tr('Conclua o checklist na aba Entrada antes de enviar.')}
            </p>
          )}
        </>
      )}
      {edit && <QuoteEditor order={order} onClose={() => setEdit(false)} />}
      {portal && current && (
        <ApprovalPortal order={order} quote={current} onClose={() => setPortal(false)} />
      )}
      <Modal
        open={print}
        onOpenChange={setPrint}
        title={tr('Prévia do orçamento')}
        description={tr('Documento ilustrativo. Não é nota fiscal.')}
        wide
      >
        <div className="print-document space-y-4">
          <div className="text-xl font-semibold [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
            pátio. <small>{tr('Oficina Horizonte · DEMONSTRAÇÃO')}</small>
          </div>
          <h2>
            {tr('OS #')}
            {order.number} {tr(' · Orçamento v')}
            {quote?.version}
          </h2>
          <p>{tr(order.title)}</p>
          {quote && (
            <>
              <QuoteTable quote={quote} />
              <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm [&>strong]:text-2xl [&>strong]:font-semibold">
                <span>Total {quote.status === 'approved' ? tr('aprovado') : tr('proposto')}</span>
                <strong>{money(quoteTotal(quote, quote.status === 'approved'))}</strong>
              </div>
            </>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr('Dados fictícios · validade e condições comerciais a combinar em um piloto real.')}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9 print:hidden">
          <Button
            variant="default"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => window.print()}
          >
            <Printer size={17} />
            {tr('Imprimir / salvar PDF')}
          </Button>
        </div>
      </Modal>
      {error && (
        <Alert variant="destructive" className="inline-error my-3" role="alert">
          {tr(error)}
        </Alert>
      )}
    </Card>
  );
}
function QuoteTable({ quote }: { quote: Quote }) {
  const { tr, money } = usePreferences();

  return (
    <div className="min-w-0">
      <Table className="[&_td_small]:block [&_td_small]:text-xs [&_td_small]:text-muted-foreground">
        <TableHeader>
          <TableRow>
            <TableHead>{tr('Descrição')}</TableHead>
            <TableHead>{tr('Qtd.')}</TableHead>
            <TableHead>{tr('Unitário')}</TableHead>
            <TableHead>{tr('Desconto')}</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quote.items.map((i) => (
            <TableRow
              key={i.id}
              className={
                quote.status === 'approved' && !quote.accepted.includes(i.id)
                  ? 'text-muted-foreground line-through'
                  : ''
              }
            >
              <TableCell>
                <strong>{tr(i.name)}</strong>
                <small>
                  {i.kind === 'part' ? tr('Peça / material') : tr('Mão de obra')}
                  {quote.status === 'approved'
                    ? quote.accepted.includes(i.id)
                      ? tr(' · aprovado')
                      : tr(' · não aprovado')
                    : ''}
                </small>
              </TableCell>
              <TableCell>{i.quantity / 100}</TableCell>
              <TableCell>{money(i.price)}</TableCell>
              <TableCell>{money(i.discount)}</TableCell>
              <TableCell>
                <strong>{money(lineTotal(i))}</strong>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
type EditorItem = {
  id: string;
  name: string;
  kind: Item['kind'];
  quantity: string;
  price: string;
  discount: string;
};
const editable = (i: Item): EditorItem => ({
  ...i,
  quantity: String(i.quantity / 100),
  price: (i.price / 100).toFixed(2),
  discount: (i.discount / 100).toFixed(2),
});
const newItem = (): EditorItem => ({
  id: uid(),
  name: '',
  kind: 'labor',
  quantity: '1',
  price: '0',
  discount: '0',
});
function number100(v: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(v))
    throw new Error('Use valores positivos com até duas casas decimais.');
  return Math.round(Number(v.replace(',', '.')) * 100);
}
function toItem(i: EditorItem): Item {
  return {
    ...i,
    quantity: number100(i.quantity),
    price: number100(i.price),
    discount: number100(i.discount),
  };
}

function QuoteEditor({ order, onClose }: { order: Order; onClose: () => void }) {
  const { tr, money } = usePreferences();

  const { commit, notify, error } = useDemo();
  const current = latestQuote(order),
    [baseVersion] = useState(current?.version ?? 0);
  const key = `patio.quote-draft.${order.id}.${baseVersion}`;
  const [items, setItems] = useState<EditorItem[]>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length <= 50 &&
          parsed.every((i) =>
            ['id', 'name', 'kind', 'quantity', 'price', 'discount'].every(
              (k) => typeof i[k] === 'string',
            ),
          )
        )
          return parsed;
      }
    } catch {
      /* Draft storage is optional; the form still works. */
    }
    return current?.items.map(editable) ?? [newItem()];
  });
  const [formError, setFormError] = useState('');
  function update(next: EditorItem[]) {
    setItems(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      setFormError('O rascunho ficará apenas nesta janela; não foi possível gravá-lo.');
    }
  }
  function patch(id: string, fields: Partial<EditorItem>) {
    update(items.map((i) => (i.id === id ? { ...i, ...fields } : i)));
  }
  let total = 0;
  try {
    total = items.map(toItem).reduce((n, i) => n + lineTotal(i), 0);
  } catch {
    /* Incomplete field while typing. */
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    try {
      const parsed = items.map(toItem);
      const { transition } = await import('@/lib/domain');
      if (
        commit((s) => {
          const idx = s.orders.findIndex((o) => o.id === order.id);
          if (idx < 0 || (latestQuote(s.orders[idx])?.version ?? 0) !== baseVersion)
            throw new Error(
              'Outra aba alterou este orçamento. Feche o editor e revise a versão atual.',
            );
          s.orders[idx] = transition(s.orders[idx], { type: 'quote', items: parsed });
          return s;
        })
      ) {
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* No impact on the saved quote. */
        }
        notify(`Orçamento v${baseVersion + 1} salvo. Pronto para revisão e envio.`);
        onClose();
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Confira os valores.');
    }
  }
  return (
    <Modal
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={
        current ? tr('Revisar orçamento · v{0}', { 0: baseVersion + 1 }) : tr('Montar orçamento')
      }
      description={tr(
        'Valores em reais. O desconto é por linha; a quantidade aceita duas casas decimais.',
      )}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-4">
          {items.map((i, idx) => (
            <div className="space-y-4 rounded-xl border p-4" key={i.id}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  ITEM {String(idx + 1).padStart(2, '0')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-destructive"
                  aria-label={tr('Remover item {0}', { 0: idx + 1 })}
                  onClick={() => update(items.filter((x) => x.id !== i.id))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Descrição')}
                  <Input
                    aria-label={tr('Descrição do item {0}', { 0: idx + 1 })}
                    required
                    maxLength={120}
                    value={i.name}
                    onChange={(e) => patch(i.id, { name: e.target.value })}
                    placeholder={tr('Nome da peça ou serviço')}
                  />
                </Label>
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Tipo')}
                  <NativeSelect
                    className="w-full"
                    aria-label={tr('Tipo do item {0}', { 0: idx + 1 })}
                    value={i.kind}
                    onChange={(e) => patch(i.id, { kind: e.target.value as Item['kind'] })}
                  >
                    <NativeSelectOption value="labor">{tr('Mão de obra')}</NativeSelectOption>
                    <NativeSelectOption value="part">{tr('Peça / material')}</NativeSelectOption>
                  </NativeSelect>
                </Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Quantidade')}
                  <Input
                    aria-label={tr('Quantidade do item {0}', { 0: idx + 1 })}
                    inputMode="decimal"
                    required
                    value={i.quantity}
                    onChange={(e) => patch(i.id, { quantity: e.target.value })}
                  />
                </Label>
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Preço unitário (R$)')}
                  <Input
                    aria-label={tr('Preço do item {0}', { 0: idx + 1 })}
                    inputMode="decimal"
                    required
                    value={i.price}
                    onChange={(e) => patch(i.id, { price: e.target.value })}
                  />
                </Label>
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Desconto (R$)')}
                  <Input
                    aria-label={tr('Desconto do item {0}', { 0: idx + 1 })}
                    inputMode="decimal"
                    required
                    value={i.discount}
                    onChange={(e) => patch(i.id, { discount: e.target.value })}
                  />
                </Label>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          type="button"
          className="h-auto min-h-9 whitespace-normal border-dashed w-full mt-4"
          disabled={items.length >= 50}
          onClick={() => update([...items, newItem()])}
        >
          <Plus size={16} />
          {tr('Adicionar item')}
        </Button>
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm [&>strong]:text-2xl [&>strong]:font-semibold">
          <span>{tr('Total da nova versão')}</span>
          <strong>{money(total)}</strong>
        </div>
        {current?.status === 'approved' && (
          <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
            {tr(
              'A nova versão suspende a execução e exige nova aprovação. O aceite anterior permanece no histórico.',
            )}
          </Alert>
        )}
        {(formError || error) && (
          <Alert variant="destructive" className="inline-error my-3" role="alert">
            {tr(formError || error)}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            type="button"
            className="h-auto min-h-9 whitespace-normal"
            onClick={onClose}
          >
            {tr('Fechar e guardar rascunho')}
          </Button>
          <Button
            variant="default"
            type="submit"
            className="h-auto min-h-9 whitespace-normal"
            disabled={!items.length}
          >
            {tr('Salvar versão ')}
            {baseVersion + 1}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ApprovalPortal({
  order,
  quote,
  onClose,
}: {
  order: Order;
  quote: Quote;
  onClose: () => void;
}) {
  const { tr, money } = usePreferences();

  const { state, act, notify, error } = useDemo();
  const [accepted, setAccepted] = useState(quote.items.map((i) => i.id));
  const [version] = useState(quote.version);
  if (!state) return null;
  const { customer, vehicle } = orderContext(state, order);
  function decide(ids: string[]) {
    if (act(order.id, { type: 'decide', version, accepted: ids })) {
      notify(
        ids.length
          ? 'Aprovação simulada registrada. Execução liberada.'
          : 'Recusa simulada registrada. Revise o orçamento.',
      );
      onClose();
    }
  }
  return (
    <Modal
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={tr('A visão do seu cliente')}
      description={tr('Simulação local. Nenhum link ou mensagem será enviado.')}
      wide
    >
      <div className="space-y-4 rounded-xl bg-muted p-5 [&_h3]:text-2xl [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground">
        <span className="mr-3 text-xl font-semibold">pátio.</span>
        <UiBadge variant="secondary">{tr('OFICINA HORIZONTE')}</UiBadge>
        <h3>
          {tr('Olá, ')}
          {customer.name.split(' ')[0]}.
        </h3>
        <p>
          {tr('Preparamos o orçamento do seu ')}
          {vehicle.model}.<br />
          {tr('Confira os itens e escolha o que deseja autorizar.')}
        </p>
        <span className="block text-xs text-muted-foreground">
          {tr('OS #')}
          {order.number} {tr(' · versão ')}
          {version}
        </span>
      </div>
      <div className="divide-y">
        {quote.items.map((i) => (
          <div
            className="flex items-center justify-between gap-3 py-4 [&>strong]:shrink-0 [&>strong]:text-sm"
            key={i.id}
          >
            <Check
              checked={accepted.includes(i.id)}
              onChange={(v) =>
                setAccepted(v ? [...accepted, i.id] : accepted.filter((id) => id !== i.id))
              }
            >
              <strong>{tr(i.name)}</strong>
              <small>
                {i.kind === 'part' ? tr('Peça / material') : tr('Mão de obra')} · {i.quantity / 100}{' '}
                {tr(' un.')}
              </small>
            </Check>
            <strong>{money(lineTotal(i))}</strong>
          </div>
        ))}
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm [&>strong]:text-2xl [&>strong]:font-semibold">
        <span>
          {accepted.length} {tr(' de ')}
          {quote.items.length} {tr(' itens selecionados')}
        </span>
        <strong>
          {money(
            quote.items
              .filter((i) => accepted.includes(i.id))
              .reduce((n, i) => n + lineTotal(i), 0),
          )}
        </strong>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={14} />
        {tr('Apenas os itens selecionados serão executados.')}
      </p>
      {error && (
        <Alert variant="destructive" className="inline-error my-3" role="alert">
          {tr(error)}
        </Alert>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
        <Button
          variant="outline"
          className="h-auto min-h-9 whitespace-normal"
          onClick={() => decide([])}
        >
          {tr('Recusar orçamento')}
        </Button>
        <Button
          variant="default"
          className="h-auto min-h-9 whitespace-normal"
          disabled={!accepted.length}
          onClick={() => decide(accepted)}
        >
          <CheckCircle2 size={17} />
          {tr('Aprovar ')}
          {accepted.length === quote.items.length ? tr('todos os itens') : tr('itens selecionados')}
        </Button>
      </div>
    </Modal>
  );
}
