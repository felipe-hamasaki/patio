'use client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { NativeSelectOption } from '@/components/ui/native-select';
import { usePreferences } from '@/lib/preferences';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  ImagePlus,
  Pencil,
  ReceiptText,
  Wrench,
  CircleCheck,
  Ban,
  Wallet,
  History,
} from 'lucide-react';
import { useDemo, orderContext } from '@/lib/demo-store';
import {
  type Order,
  latestQuote,
  quoteTotal,
  paid,
  balance,
  checklistLabels,
  uid,
  stageLabels,
} from '@/lib/domain';
import { Avatar, Badge, Check, Empty, Modal } from '@/components/patio-ui';
import { QuotePanel } from '@/features/quotes/quote-panel';
import { localInputDate } from './new-order';

const tabs = [
  { id: 'entry', name: 'Entrada', icon: CarFront },
  { id: 'quote', name: 'Orçamento', icon: FileText },
  { id: 'execution', name: 'Execução', icon: Wrench },
  { id: 'payments', name: 'Recebimentos', icon: Wallet },
  { id: 'history', name: 'Histórico', icon: History },
];
export function OrderDetail({ id }: { id: string }) {
  const { tr, money, dateTime, locale } = usePreferences();

  const { state, act, notify, error } = useDemo();
  const order = state?.orders.find((o) => o.id === id);
  const [tab, setTab] = useState('quote'),
    [metadata, setMetadata] = useState(false),
    [delivery, setDelivery] = useState(false),
    [reason, setReason] = useState('');
  if (!state || !order)
    return (
      <Empty
        title={tr('Não encontramos esta ordem.')}
        description={tr('O cenário pode ter sido restaurado em outra aba.')}
        action={
          <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal">
            <Link href="/demo/ordens">{tr('Voltar às ordens')}</Link>
          </Button>
        }
      />
    );
  const { customer, vehicle } = orderContext(state, order),
    quote = latestQuote(order);
  const flow = ['diagnosis', 'approval', 'execution', 'ready', 'delivered'];
  const hints: Record<Order['stage'], [string, string, string]> = {
    diagnosis: [
      tr('Um bom diagnóstico faz a diferença.'),
      tr('Confira a entrada e prepare o orçamento para o cliente.'),
      'entry',
    ],
    approval: [
      tr('O próximo passo é do cliente.'),
      tr('Simule a aprovação para liberar os serviços autorizados.'),
      'quote',
    ],
    execution: [
      tr('Mãos à obra, com tudo no lugar.'),
      tr('Registre os serviços e faça a conferência antes da retirada.'),
      'execution',
    ],
    ready: [
      tr('Tudo pronto para seguir viagem.'),
      tr('Confira o saldo e registre a entrega do veículo.'),
      'payments',
    ],
    delivered: [
      tr('Mais um cuidado concluído.'),
      tr('A entrega foi registrada. O histórico continua por aqui.'),
      'history',
    ],
    cancelled: [
      tr('Atendimento cancelado.'),
      tr('Os registros foram preservados para consulta.'),
      'history',
    ],
  };
  return (
    <>
      <Button asChild variant="link" className="h-auto min-h-9 whitespace-normal mb-5 w-fit px-0">
        <Link
          href="/demo/ordens"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          {tr('Ordens de serviço')}
        </Link>
      </Button>
      <div className="detail-heading mb-6 flex flex-wrap items-center justify-between gap-4 [&_h1]:mt-2 [&_h1]:text-3xl [&_h1]:font-semibold [&_p]:mt-2 [&_p]:flex [&_p]:flex-wrap [&_p]:items-center [&_p]:gap-2 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {tr('ORDEM DE SERVIÇO #')}
            {order.number}
          </div>
          <h1 id="page-title" tabIndex={-1}>
            {vehicle.model}
            <span className="ml-2 text-xl text-muted-foreground">{vehicle.year}</span>
          </h1>
          <p>
            {customer.name}
            <span>·</span>
            <span className="font-mono text-xs tracking-wide">{vehicle.plate}</span>
            <span>·</span>
            {order.mileage.toLocaleString(locale)} km
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge stage={order.stage} />
          {!['delivered', 'cancelled'].includes(order.stage) && (
            <Button
              variant="outline"
              data-modal-return
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => setMetadata(true)}
            >
              <Pencil size={15} />
              {tr('Editar prazo')}
            </Button>
          )}
        </div>
      </div>
      <div
        className="mb-5 grid grid-cols-5 gap-1 rounded-xl border bg-card p-3"
        aria-label={tr('Progresso do atendimento')}
      >
        {flow.map((stage, index) => (
          <div
            key={stage}
            className="flex min-w-0 flex-col items-center gap-2 text-center text-[10px] text-muted-foreground aria-[current=step]:text-foreground [&>strong]:break-words"
            aria-current={order.stage === stage ? 'step' : undefined}
          >
            <UiBadge
              variant={flow.indexOf(order.stage) >= index ? 'default' : 'outline'}
              className="size-7 justify-center rounded-full p-0"
            >
              {flow.indexOf(order.stage) > index ? <CheckCircle2 size={16} /> : index + 1}
            </UiBadge>
            <strong>{tr(stageLabels[stage as Order['stage']])}</strong>
            {index < 4 && <i />}
          </div>
        ))}
      </div>
      <Alert
        role="note"
        className="mb-6 flex flex-wrap items-center gap-3 [&>div]:min-w-0 [&>div]:flex-1 [&_p]:text-sm [&_p]:text-muted-foreground"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {order.stage === 'ready' || order.stage === 'delivered' ? (
            <CircleCheck size={23} />
          ) : (
            <Wrench size={23} />
          )}
        </span>
        <div>
          <strong>{hints[order.stage][0]}</strong>
          <p>{hints[order.stage][1]}</p>
        </div>
        {order.stage === 'ready' ? (
          <Button
            variant="default"
            data-modal-return
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setDelivery(true)}
          >
            {tr('Registrar entrega')}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            variant="link"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setTab(hints[order.stage][2])}
          >
            {tr('Ver próximo passo')}
            <ArrowRight size={16} />
          </Button>
        )}
      </Alert>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0">
          <TabsList
            className="mb-3 h-auto w-full flex-wrap justify-start"
            aria-label={tr('Detalhes do atendimento')}
          >
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="min-h-9">
                <t.icon />
                {tr(t.name)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab}>
            {tab === 'entry' && <Entry order={order} />}
            {tab === 'quote' && <QuotePanel order={order} />}
            {tab === 'execution' && <Execution order={order} />}
            {tab === 'payments' && <Payments order={order} />}
            {tab === 'history' && (
              <Card className="min-w-0 gap-4 p-5 sm:p-6">
                <h2>{tr('O caminho até aqui')}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tr('Eventos da demonstração, do mais recente ao primeiro.')}
                </p>
                <ol className="space-y-5 border-l pl-4 [&_li]:relative [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                  {[...order.events].reverse().map((e) => (
                    <li key={e.id}>
                      <span className="absolute top-1 -left-5 size-2 rounded-full bg-primary" />
                      <div>
                        <strong>{tr(e.description)}</strong>
                        <small>
                          {dateTime(e.at)} {tr(' · Equipe Horizonte · demo')}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0 gap-4 p-5 sm:p-6 [&_h2]:text-lg [&_h2]:font-semibold">
            <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {tr('RESUMO DO ATENDIMENTO')}
            </div>
            <h2>{tr(order.title)}</h2>
            <div className="space-y-2 border-b pb-4 [&>span]:block [&>span]:text-xs [&>span]:text-muted-foreground [&>strong]:flex [&>strong]:items-center [&>strong]:gap-2 [&>small]:block [&>small]:text-xs [&>small]:text-muted-foreground">
              <span>{tr('Responsável')}</span>
              <strong className="inline-flex items-center gap-2">
                <Avatar name={order.tech} small />
                {order.tech}
              </strong>
            </div>
            <div className="space-y-2 border-b pb-4 [&>span]:block [&>span]:text-xs [&>span]:text-muted-foreground [&>strong]:flex [&>strong]:items-center [&>strong]:gap-2 [&>small]:block [&>small]:text-xs [&>small]:text-muted-foreground">
              <span>{tr('Previsão de entrega')}</span>
              <strong>
                <Clock3 size={14} />
                {dateTime(order.due)}
              </strong>
            </div>
            <div className="space-y-2 border-b pb-4 [&>span]:block [&>span]:text-xs [&>span]:text-muted-foreground [&>strong]:flex [&>strong]:items-center [&>strong]:gap-2 [&>small]:block [&>small]:text-xs [&>small]:text-muted-foreground">
              <span>{tr('Cliente')}</span>
              <strong>{customer.name}</strong>
              <small>{customer.contact || tr('Contato não informado')}</small>
            </div>
            <div className="space-y-3 [&>div]:flex [&>div]:justify-between [&>div]:gap-2 [&>div]:text-sm">
              <div>
                <span>
                  {quote?.status === 'approved' ? tr('Valor aprovado') : tr('Valor proposto')}
                </span>
                <strong>{money(quoteTotal(quote, quote?.status === 'approved'))}</strong>
              </div>
              <div>
                <span>{tr('Recebido na demo')}</span>
                <strong>{money(paid(order))}</strong>
              </div>
              <div className="border-t pt-3">
                <span>{tr('Saldo a receber')}</span>
                <strong>
                  {quote?.status === 'approved' ? money(balance(order)) : tr('A aprovar')}
                </strong>
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
              {tr('Recebimentos são fictícios. Não há movimentação bancária.')}
            </p>
          </Card>
          <div className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground [&>svg]:shrink-0">
            <ClipboardCheck size={20} />
            <p>
              {tr(
                'O andamento do serviço e o recebimento são independentes. Cada etapa tem seu próprio registro.',
              )}
            </p>
          </div>
        </aside>
      </div>
      {metadata && <MetadataEditor order={order} onClose={() => setMetadata(false)} />}
      <Modal
        open={delivery}
        onOpenChange={setDelivery}
        title={tr('Pronto para seguir viagem')}
        description={tr('Registre a entrega do {0} para {1}.', {
          0: vehicle.model,
          1: customer.name,
        })}
      >
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm [&>strong]:text-2xl [&>strong]:font-semibold">
          <span>{tr('Saldo pendente')}</span>
          <strong>{money(balance(order))}</strong>
        </div>
        {balance(order) > 0 ? (
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Motivo da entrega com saldo pendente')}
            <Textarea
              autoFocus
              minLength={5}
              maxLength={250}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tr('Ex.: Cliente combinará o pagamento amanhã.')}
            />
            <small className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
              {tr('Autorização simulada no perfil de gestora. Mínimo de 5 caracteres.')}
            </small>
          </Label>
        ) : (
          <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
            <CheckCircle2 size={19} />
            {tr('Saldo quitado na demonstração.')}
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" role="alert" className="inline-error my-3">
            {tr(error)}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setDelivery(false)}
          >
            {tr('Voltar')}
          </Button>
          <Button
            variant="default"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => {
              if (act(id, { type: 'deliver', reason })) {
                setDelivery(false);
                notify('Veículo entregue. Mais um atendimento concluído.');
              }
            }}
          >
            {tr('Confirmar entrega')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
function Entry({ order }: { order: Order }) {
  const { tr, dateTime } = usePreferences();

  const { act, notify, error } = useDemo();
  const [cancel, setCancel] = useState(false),
    [reason, setReason] = useState('');
  return (
    <Card className="min-w-0 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>{tr('Todo cuidado tem um começo')}</h2>
          <p>{tr('O que foi registrado na chegada do veículo.')}</p>
        </div>
        <UiBadge variant="secondary">{dateTime(order.createdAt)}</UiBadge>
      </div>
      <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {tr('RELATO DO CLIENTE')}
        </span>
        <p>{tr(order.report)}</p>
      </div>
      <h3>
        {tr('Checklist de entrada')}{' '}
        <UiBadge variant="secondary">{order.checks.filter(Boolean).length}/4</UiBadge>
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {checklistLabels.map((label, i) => (
          <Check
            key={label}
            checked={order.checks[i]}
            disabled={order.stage !== 'diagnosis'}
            onChange={(v) => act(order.id, { type: 'check', index: i, done: v, final: false })}
          >
            {tr(label)}
          </Check>
        ))}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h3>{tr('Registro visual')}</h3>
          <p>{tr('Ilustrações de exemplo, sem fotos reais.')}</p>
        </div>
        {order.stage === 'diagnosis' && order.photos.length < 2 && (
          <Button
            variant="outline"
            size="sm"

            onClick={() => {
              if (
                act(order.id, {
                  type: 'photo',
                  photo: order.photos.includes('front') ? 'panel' : 'front',
                })
              )
                notify('Imagem ilustrativa adicionada à entrada.');
            }}
          >
            <ImagePlus size={16} />
            {tr('Adicionar exemplo')}
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {order.photos.map((p) => (
          <div
            className="overflow-hidden rounded-lg border [&>span]:block [&>span]:p-3 [&>span]:text-xs [&>span]:text-muted-foreground"
            key={p}
          >
            <div className="flex h-32 items-center justify-center bg-muted [&>svg]:size-16">
              {p === 'front' ? (
                <CarFront size={90} strokeWidth={1} />
              ) : (
                <>
                  <span>
                    68.400<small>KM</small>
                  </span>
                  <span />
                </>
              )}
            </div>
            <span>
              {p === 'front' ? tr('Vista frontal') : tr('Painel de instrumentos')}{' '}
              {tr(' · ilustração')}
            </span>
          </div>
        ))}
        {!order.photos.length && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr('Nenhuma imagem adicionada.')}
          </p>
        )}
      </div>
      {['diagnosis', 'approval'].includes(order.stage) && (
        <div className="mt-5 space-y-3 border-t pt-5 [&_p]:text-sm [&_p]:text-muted-foreground">
          <p>{tr('O atendimento não vai continuar?')}</p>
          <Button
            variant="link"
            className="text-destructive h-auto min-h-9 whitespace-normal"
            onClick={() => setCancel(true)}
          >
            <Ban size={15} />
            {tr('Cancelar OS')}
          </Button>
        </div>
      )}
      <Modal
        open={cancel}
        onOpenChange={setCancel}
        title={tr('Cancelar este atendimento?')}
        description={tr('A OS sai da operação. O orçamento e o histórico continuam disponíveis.')}
      >
        <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
          {tr('Motivo do cancelamento')}
          <Textarea
            value={reason}
            minLength={5}
            maxLength={250}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tr('Conte o que aconteceu')}
          />
        </Label>
        {error && (
          <Alert variant="destructive" className="inline-error my-3" role="alert">
            {tr(error)}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setCancel(false)}
          >
            {tr('Manter atendimento')}
          </Button>
          <Button
            variant="destructive"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => {
              if (act(order.id, { type: 'cancel', reason })) {
                setCancel(false);
                notify('OS cancelada. Histórico preservado.');
              }
            }}
          >
            {tr('Confirmar cancelamento')}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
function Execution({ order }: { order: Order }) {
  const { tr } = usePreferences();

  const { act, notify, error } = useDemo();
  const [block, setBlock] = useState(false),
    [reason, setReason] = useState('');
  const q = latestQuote(order),
    items = q?.items.filter((i) => q.accepted.includes(i.id)) ?? [];
  if (q?.status !== 'approved')
    return (
      <Card className="min-w-0 gap-4 p-5 sm:p-6">
        <Empty
          title={tr('Primeiro, a autorização.')}
          description={tr(
            'Envie o orçamento e simule a aprovação. Somente os itens aceitos serão liberados para execução.',
          )}
        />
      </Card>
    );
  const allDone = items.every((i) => order.completed.includes(i.id));
  return (
    <Card className="min-w-0 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>{tr('Do combinado ao concluído')}</h2>
          <p>
            {tr('Apenas os itens aprovados na versão ')}
            {q.version}.
          </p>
        </div>
        <UiBadge variant="secondary">
          {order.completed.length}/{items.length} {tr(' concluídos')}
        </UiBadge>
      </div>
      <Progress
        value={items.length ? (order.completed.length / items.length) * 100 : 0}
        aria-label={tr('Execução')}
      />
      {order.blocked && (
        <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
          <Wrench size={19} />
          <div>
            <strong>{tr('Aguardando peça')}</strong>
            <p>{tr(order.blocked)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"

            onClick={() => {
              if (act(order.id, { type: 'block', reason: '' }))
                notify('Peça recebida. Execução liberada.');
            }}
          >
            {tr('Registrar chegada')}
          </Button>
        </Alert>
      )}
      <div className="space-y-4">
        {items.map((i) => (
          <Check
            key={i.id}
            checked={order.completed.includes(i.id)}
            disabled={!!order.blocked || order.stage !== 'execution'}
            onChange={(done) => act(order.id, { type: 'task', itemId: i.id, done })}
          >
            <strong>{tr(i.name)}</strong>
            <small>
              {i.kind === 'part' ? tr('Instalação / aplicação de material') : tr('Serviço')} ·{' '}
              {i.quantity / 100} {tr(' un.')}
            </small>
          </Check>
        ))}
      </div>
      <div className="space-y-3 rounded-xl bg-muted/50 p-4 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:font-medium">
        <h3>
          <ClipboardCheck size={19} />
          {tr('Último olhar antes da entrega')}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tr('Depois dos serviços, confirme as duas verificações.')}
        </p>
        {[
          tr('Teste de funcionamento concluído'),
          tr('Veículo e itens conferidos para retirada'),
        ].map((label, i) => (
          <Check
            key={label}
            checked={order.finalChecks[i]}
            disabled={!allDone || !!order.blocked || order.stage !== 'execution'}
            onChange={(done) => act(order.id, { type: 'check', index: i, done, final: true })}
          >
            {tr(label)}
          </Check>
        ))}
      </div>
      {order.stage === 'execution' && (
        <div className="mt-4 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            className="h-auto min-h-9 whitespace-normal"
            disabled={!!order.blocked}
            onClick={() => setBlock(true)}
          >
            <Wrench size={16} />
            {tr('Aguardando peça')}
          </Button>
          <Button
            variant="default"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => {
              if (act(order.id, { type: 'ready' }))
                notify('Conferência concluída. Veículo pronto para retirada.');
            }}
          >
            <CheckCircle2 size={16} />
            {tr('Concluir execução')}
          </Button>
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="inline-error my-3" role="alert">
          {tr(error)}
        </Alert>
      )}
      <Modal
        open={block}
        onOpenChange={setBlock}
        title={tr('O que falta para continuar?')}
        description={tr('O bloqueio pausa os serviços até a chegada da peça.')}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (act(order.id, { type: 'block', reason })) {
              setBlock(false);
              notify('Pendência de peça registrada.');
            }
          }}
        >
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Peça e previsão')}
            <Textarea
              required
              minLength={3}
              maxLength={250}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tr('Ex.: Pastilhas dianteiras, amanhã às 10h')}
            />
          </Label>
          {error && (
            <Alert variant="destructive" className="inline-error my-3" role="alert">
              {tr(error)}
            </Alert>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
            <Button
              variant="outline"
              type="button"
              className="h-auto min-h-9 whitespace-normal"
              onClick={() => setBlock(false)}
            >
              {tr('Voltar')}
            </Button>
            <Button variant="default" className="h-auto min-h-9 whitespace-normal">
              {tr('Registrar pendência')}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
export function Payments({ order }: { order: Order }) {
  const { tr, money, dateTime } = usePreferences();

  const [open, setOpen] = useState(false);
  const q = latestQuote(order);
  return (
    <Card className="min-w-0 gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
        <div>
          <h2>{tr('Contas claras, atendimento tranquilo')}</h2>
          <p>{tr('Registros manuais e fictícios de recebimento.')}</p>
        </div>
        <Button
          variant="default"
          data-modal-return
          className="h-auto min-h-9 whitespace-normal"
          disabled={q?.status !== 'approved' || balance(order) <= 0}
          onClick={() => setOpen(true)}
        >
          <PlusIcon />
          {tr('Registrar recebimento')}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-3 [&_span]:text-xs [&_span]:text-muted-foreground [&_strong]:mt-1 [&_strong]:block [&_strong]:text-xl">
        <div>
          <span>{tr('Valor aprovado')}</span>
          <strong>{money(quoteTotal(q, true))}</strong>
        </div>
        <div>
          <span>{tr('Recebido')}</span>
          <strong>{money(paid(order))}</strong>
        </div>
        <div>
          <span>{tr('Saldo pendente')}</span>
          <strong>{money(balance(order))}</strong>
        </div>
      </div>
      {order.payments.length ? (
        <div>
          {[...order.payments].reverse().map((p) => (
            <div
              className="flex flex-wrap items-center gap-3 border-b py-4 last:border-0 [&>div]:flex-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground"
              key={p.id}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ReceiptText size={20} />
              </span>
              <div>
                <strong>
                  {tr(p.method)} {tr(' · lançamento fictício')}
                </strong>
                <small>{dateTime(p.at)}</small>
              </div>
              <strong>{money(p.amount)}</strong>
              <UiBadge variant="secondary">{tr('Registrado')}</UiBadge>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={tr('Nenhum recebimento registrado.')}
          description={tr('Após a aprovação, registre valores parciais ou o total do atendimento.')}
        />
      )}
      <div className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground [&>svg]:shrink-0">
        <Wallet size={18} />
        <p>
          {tr(
            'Registrar aqui não processa Pix, cartão ou cobrança. Não há integração bancária nesta demonstração.',
          )}
        </p>
      </div>
      {open && <PaymentModal order={order} onClose={() => setOpen(false)} />}
    </Card>
  );
}
function PlusIcon() {
  return <span aria-hidden="true">+</span>;
}
function PaymentModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { tr, money } = usePreferences();

  const { act, error, notify } = useDemo();
  const [amount, setAmount] = useState((balance(order) / 100).toFixed(2)),
    [method, setMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix'),
    [id] = useState(uid),
    [invalid, setInvalid] = useState('');
  return (
    <Modal
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={tr('Registrar recebimento')}
      description={tr('Um lançamento de demonstração, sem movimentação de dinheiro.')}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount)) {
            setInvalid('Use um valor com até duas casas decimais.');
            return;
          }
          if (
            act(order.id, {
              type: 'payment',
              id,
              amount: Math.round(Number(amount.replace(',', '.')) * 100),
              method,
            })
          ) {
            notify('Recebimento fictício registrado. Saldo atualizado.');
            onClose();
          }
        }}
      >
        <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
          {tr('Saldo disponível: ')}
          <strong>{money(balance(order))}</strong>
        </Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Valor (R$)')}
            <Input
              autoFocus
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setInvalid('');
              }}
            />
          </Label>
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Forma de recebimento')}
            <NativeSelect
              className="w-full"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
            >
              <NativeSelectOption>Pix</NativeSelectOption>
              <NativeSelectOption value="Dinheiro">{tr('Dinheiro')}</NativeSelectOption>
              <NativeSelectOption value="Cartão">{tr('Cartão')}</NativeSelectOption>
            </NativeSelect>
          </Label>
        </div>
        {(invalid || error) && (
          <Alert variant="destructive" className="inline-error my-3" role="alert">
            {tr(invalid || error)}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            type="button"
            className="h-auto min-h-9 whitespace-normal"
            onClick={onClose}
          >
            {tr('Voltar')}
          </Button>
          <Button variant="default" className="h-auto min-h-9 whitespace-normal">
            {tr('Confirmar recebimento fictício')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function MetadataEditor({ order, onClose }: { order: Order; onClose: () => void }) {
  const { tr } = usePreferences();

  const { act, notify, error } = useDemo();
  const [tech, setTech] = useState(order.tech),
    [due, setDue] = useState(localInputDate(order.due));
  return (
    <Modal
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title={tr('Ajustar o atendimento')}
      description={tr('Mantenha a equipe e o cliente alinhados com a previsão.')}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (act(order.id, { type: 'metadata', tech, due: new Date(due).toISOString() })) {
            notify('Responsável e previsão atualizados.');
            onClose();
          }
        }}
      >
        <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
          {tr('Responsável')}
          <NativeSelect
            className="w-full"
            value={tech}
            onChange={(e) => setTech(e.target.value as Order['tech'])}
          >
            {['Rafael', 'Bruno', 'Camila'].map((t) => (
              <NativeSelectOption key={t}>{t}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
          {tr('Previsão de entrega')}
          <Input
            required
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Label>
        <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
          {tr('Horário do seu dispositivo; exibição na oficina em Brasília.')}
        </p>
        {error && (
          <Alert variant="destructive" role="alert" className="inline-error my-3">
            {tr(error)}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
          <Button
            variant="outline"
            type="button"
            className="h-auto min-h-9 whitespace-normal"
            onClick={onClose}
          >
            {tr('Voltar')}
          </Button>
          <Button variant="default" className="h-auto min-h-9 whitespace-normal">
            {tr('Salvar alterações')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
