'use client';
import { Button } from '@/components/ui/button';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { NativeSelectOption } from '@/components/ui/native-select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePreferences } from '@/lib/preferences';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import Link from 'next/link';
import {
  Plus,
  Search,
  Columns3,
  List,
  ArrowUpRight,
  CarFront,
  Clock3,
  CircleCheck,
  CircleAlert,
  ChevronRight,
  Wrench,
  SlidersHorizontal,
} from 'lucide-react';
import { useDemo, orderContext } from '@/lib/demo-store';
import {
  type Order,
  type Stage,
  stageLabels,
  isLate,
  normalize,
  latestQuote,
  quoteTotal,
} from '@/lib/domain';
import { Avatar, Badge, Empty, PageTitle, VehicleIcon, stageColors } from '@/components/patio-ui';
import { cn } from '@/lib/utils';

export function Overview({ ordersOnly }: { ordersOnly: boolean }) {
  const { tr, dateTime, locale } = usePreferences();

  const { state } = useDemo();
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('active'),
    [view, setView] = useState<'board' | 'list'>('board'),
    [tech, setTech] = useState('all');
  if (!state) return null;
  const active = state.orders.filter((o) => !['delivered', 'cancelled'].includes(o.stage));
  const metrics = [
    {
      label: tr('Veículos no pátio'),
      value: active.length,
      sub: tr('Atendimentos em andamento'),
      icon: CarFront,
      filter: 'active',
      color: 'bg-info text-info-foreground hover:bg-info/80 hover:text-info-foreground',
    },
    {
      label: tr('Aguardando aprovação'),
      value: active.filter((o) => o.stage === 'approval').length,
      sub: tr('O próximo passo é do cliente'),
      icon: Clock3,
      filter: 'approval',
      color: 'bg-warning text-warning-foreground hover:bg-warning/80 hover:text-warning-foreground',
    },
    {
      label: tr('Prontos para retirada'),
      value: active.filter((o) => o.stage === 'ready').length,
      sub: tr('Tudo certo para seguir viagem'),
      icon: CircleCheck,
      filter: 'ready',
      color: 'bg-success text-success-foreground hover:bg-success/80 hover:text-success-foreground',
    },
    {
      label: tr('Precisam de atenção'),
      value: active.filter((o) => isLate(o) || o.blocked).length,
      sub: tr('Prazo vencido ou peça pendente'),
      icon: CircleAlert,
      filter: 'attention',
      color: 'bg-danger text-danger-foreground hover:bg-danger/80 hover:text-danger-foreground',
    },
  ];
  const filtered = state.orders.filter((o) => {
    const { customer, vehicle } = orderContext(state, o);
    return (
      normalize(
        `${o.number} ${customer.name} ${vehicle.model} ${vehicle.plate} ${o.title} ${tr(o.title)}`,
      ).includes(normalize(query)) &&
      (tech === 'all' || o.tech === tech) &&
      (filter === 'all' ||
        (filter === 'active' && active.includes(o)) ||
        (filter === 'attention' && active.includes(o) && (isLate(o) || !!o.blocked)) ||
        o.stage === filter)
    );
  });
  const stages: Stage[] = [
    'diagnosis',
    'approval',
    'execution',
    'ready',
    ...(['all', 'delivered', 'cancelled'].includes(filter)
      ? (['delivered', 'cancelled'] as Stage[])
      : []),
  ];
  return (
    <>
      <PageTitle
        eyebrow={
          ordersOnly
            ? tr('CADA DETALHE SOB CONTROLE')
            : new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'America/Sao_Paulo',
              })
                .format(new Date())
                .toUpperCase()
        }
        title={ordersOnly ? tr('Ordens de serviço') : tr('Um bom dia começa no pátio')}
        description={
          ordersOnly
            ? tr('Do primeiro relato à entrega. Tudo conectado em um só lugar.')
            : tr('Acompanhe os serviços, destrave pendências e cuide da próxima entrega.')
        }
        action={
          <Button asChild variant="default" className="h-auto min-h-9 whitespace-normal">
            <Link href="/demo/ordens/nova">
              <Plus size={18} />
              {tr('Nova ordem de serviço')}
            </Link>
          </Button>
        }
      />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="gap-0 overflow-hidden p-0">
            <Button
              variant="ghost"
              className={cn(
                'h-full w-full flex-col items-stretch rounded-xl p-4 text-left whitespace-normal aria-pressed:ring-2 aria-pressed:ring-current aria-pressed:ring-inset sm:p-5 [&>small]:font-normal',
                m.color,
              )}
              onClick={() => {
                setFilter(m.filter);
                setQuery('');
                setTech('all');
              }}
              aria-pressed={filter === m.filter}
            >
              <div className="flex w-full items-center justify-between gap-2 text-sm">
                <span>{tr(m.label)}</span>
                <m.icon size={19} className="size-4" />
              </div>
              <div className="my-3 flex w-full items-center justify-between text-3xl font-semibold tracking-tight tabular-nums [&>svg]:size-4">
                {String(m.value).padStart(2, '0')}
                <ArrowUpRight size={20} />
              </div>
              <small>{tr(m.sub)}</small>
            </Button>
          </Card>
        ))}
      </div>
      <section aria-labelledby="operation-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
          <div>
            <h2 id="operation-title">
              {ordersOnly ? tr('Seus atendimentos') : tr('O ritmo da oficina')}
              <UiBadge variant="secondary">{filtered.length}</UiBadge>
            </h2>
            <p>{tr('Cada veículo no seu próximo passo.')}</p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            onValueChange={(value) => {
              if (value) setView(value as 'board' | 'list');
            }}
            aria-label={tr('Visualização')}
          >
            <ToggleGroupItem value="board" aria-label={tr('Quadro')}>
              <Columns3 />
              {tr('Quadro')}
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={tr('Lista')}>
              <List />
              {tr('Lista')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="my-4 flex flex-wrap items-center justify-between gap-3">
          <Label className="relative block min-w-0 flex-1 basis-64 [&>svg]:absolute [&>svg]:top-2.5 [&>svg]:left-3 [&>svg]:size-4 [&>svg]:text-muted-foreground [&>input]:h-9 [&>input]:pl-9 [&>kbd]:hidden">
            <Search size={18} />
            <Input
              aria-label={tr('Buscar ordens de serviço')}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Buscar por OS, cliente, veículo ou placa…')}
            />
            <kbd>⌕</kbd>
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="flex min-w-0 items-center gap-2 [&>svg]:hidden">
              <SlidersHorizontal size={15} />
              <NativeSelect
                className="w-full"
                aria-label={tr('Filtrar por etapa')}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <NativeSelectOption value="active">{tr('Em andamento')}</NativeSelectOption>
                <NativeSelectOption value="all">{tr('Todas as ordens')}</NativeSelectOption>
                <NativeSelectOption value="attention">
                  {tr('Precisam de atenção')}
                </NativeSelectOption>
                {Object.entries(stageLabels).map(([key, label]) => (
                  <NativeSelectOption key={key} value={key}>
                    {tr(label)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
            <Label className="flex min-w-0 items-center gap-2 [&>svg]:hidden">
              <NativeSelect
                className="w-full"
                aria-label={tr('Filtrar por responsável')}
                value={tech}
                onChange={(e) => setTech(e.target.value)}
              >
                <NativeSelectOption value="all">{tr('Toda a equipe')}</NativeSelectOption>
                {['Rafael', 'Bruno', 'Camila'].map((t) => (
                  <NativeSelectOption key={t}>{t}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
          </div>
        </div>
        <div
          className="mb-4 flex items-center gap-1 text-xs text-muted-foreground [&>button]:ml-auto"
          aria-live="polite"
        >
          <span>
            {filtered.length} {tr(' atendimento')}
            {filtered.length !== 1 ? 's' : ''}
            {query ? tr(' para “{0}”', { 0: query }) : ''}
          </span>
          <Button
            variant="link"
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => {
              setFilter('active');
              setTech('all');
              setQuery('');
            }}
          >
            {tr('Limpar filtros')}
          </Button>
        </div>
        {!filtered.length ? (
          <Empty
            action={
              <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal">
                <Link href="/demo/ordens/nova">
                  <Plus size={16} />
                  {tr('Receber um veículo')}
                </Link>
              </Button>
            }
          />
        ) : view === 'board' ? (
          <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {stages.map((stage, idx) => (
              <section
                className={cn('min-w-0 rounded-xl', stageColors[stage])}
                key={stage}
                aria-label={tr(stageLabels[stage])}
              >
                <div className="flex items-center justify-between gap-2 p-3 text-xs font-medium [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_b]:rounded-md [&_b]:bg-background [&_b]:px-1.5 [&_b]:py-0.5">
                  <span>
                    {tr(stageLabels[stage])}
                    <b>{filtered.filter((o) => o.stage === stage).length}</b>
                  </span>
                  <span>0{idx + 1}</span>
                </div>
                <div className="space-y-3 p-2 pt-0">
                  {filtered
                    .filter((o) => o.stage === stage)
                    .map((o) => (
                      <OrderCard key={o.id} order={o} />
                    ))}
                  {!filtered.some((o) => o.stage === stage) && (
                    <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-xs">
                      <CircleCheck size={20} />
                      <span>{tr('Tudo em dia por aqui.')}</span>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr('Veículo / cliente')}</TableHead>
                  <TableHead>{tr('Serviço')}</TableHead>
                  <TableHead>{tr('Etapa')}</TableHead>
                  <TableHead>{tr('Previsão')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const { customer, vehicle } = orderContext(state, o);
                  return (
                    <TableRow className="list-row" key={o.id}>
                      <TableCell>
                        <Button asChild variant="link" className="h-auto px-0 text-left">
                          <Link
                            href={`/demo/ordens/${o.id}`}
                            aria-label={tr('Abrir OS {0}, {1}', { 0: o.number, 1: vehicle.model })}
                          >
                            <div className="flex items-center gap-3 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                              <VehicleIcon />
                              <div>
                                <strong>{vehicle.model}</strong>
                                <small>
                                  {customer.name} · #{o.number}
                                </small>
                              </div>
                            </div>
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>{tr(o.title)}</TableCell>
                      <TableCell>
                        <Badge stage={o.stage} />
                      </TableCell>
                      <TableCell
                        className={isLate(o) ? 'text-destructive' : 'text-muted-foreground'}
                      >
                        {dateTime(o.due)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <span />
          {tr('Uma oficina organizada, uma entrega de cada vez.')}
        </span>
        <span>{tr('Horários de Brasília · dados de demonstração')}</span>
      </div>
    </>
  );
}
function OrderCard({ order: o }: { order: Order }) {
  const { tr, money, dateTime, locale } = usePreferences();

  const { state } = useDemo();
  if (!state) return null;
  const { customer, vehicle } = orderContext(state, o),
    q = latestQuote(o);
  return (
    <Card className="gap-0 p-0">
      <Link
        className="order-card block space-y-4 rounded-xl p-4 outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
        href={`/demo/ordens/${o.id}`}
        aria-label={tr('Abrir OS {0}, {1}', { 0: o.number, 1: vehicle.model })}
      >
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {tr('OS #')}
            {o.number}
          </span>
          <span className="font-mono text-xs tracking-wide">{vehicle.plate}</span>
        </div>
        <div className="flex items-center gap-3 [&_h3]:font-semibold [&_p]:text-xs [&_p]:text-muted-foreground">
          <VehicleIcon />
          <div>
            <h3>{vehicle.model}</h3>
            <p>{customer.name}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{tr(o.title)}</p>
        <div className="flex flex-wrap gap-2">
          {o.blocked ? (
            <UiBadge variant="secondary" className="bg-warning text-warning-foreground">
              <Wrench size={12} />
              {tr('Aguardando peça')}
            </UiBadge>
          ) : isLate(o) ? (
            <UiBadge variant="secondary" className="bg-danger text-danger-foreground">
              <Clock3 size={12} />
              {tr('Prazo excedido')}
            </UiBadge>
          ) : (
            <UiBadge
              variant="secondary"
              className={o.stage === 'ready' ? stageColors.ready : undefined}
            >
              {o.stage === 'ready'
                ? tr('Conferência concluída')
                : `${vehicle.year} · ${o.mileage.toLocaleString(locale)} km`}
            </UiBadge>
          )}
        </div>
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-2">
            <Avatar name={o.tech} small />
            {o.tech}
          </span>
          <strong>{q ? money(quoteTotal(q, q.status === 'approved')) : tr('A orçar')}</strong>
        </div>
        <div
          className={`flex items-center gap-2 border-t pt-3 text-xs ${isLate(o) ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          <Clock3 size={12} />
          {dateTime(o.due)}
          <ChevronRight size={13} />
        </div>
      </Link>
    </Card>
  );
}
