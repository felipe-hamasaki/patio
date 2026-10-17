'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { NativeSelect } from '@/components/ui/native-select';
import { NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreferences } from '@/lib/preferences';
import { PreferencesControls } from '@/components/preferences-controls';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  CarFront,
  ArrowUpRight,
  Wallet,
  RotateCcw,
  AlertTriangle,
  LockKeyhole,
  CheckCircle2,
  Download,
  FlaskConical,
} from 'lucide-react';
import { useDemo, orderContext } from '@/lib/demo-store';
import { normalize, paid, balance, customerSchema, uid } from '@/lib/domain';
import { Avatar, Empty, Modal, OrderLink, PageTitle } from '@/components/patio-ui';
import { CustomerDetail } from '@/features/customers/customer-detail';
import { ScenarioImport } from '@/features/scenario-import';

export function Customers() {
  const { tr } = usePreferences();

  const { state, commit, error, notify } = useDemo();
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState<string | null>(null),
    [create, setCreate] = useState(false),
    [name, setName] = useState(''),
    [contact, setContact] = useState('');
  if (!state) return null;
  const rows = state.customers.filter((c) =>
    normalize(
      `${c.name} ${c.contact} ${state.vehicles
        .filter((v) => v.customerId === c.id)
        .map((v) => `${v.model} ${v.plate}`)
        .join(' ')}`,
    ).includes(normalize(query)),
  );
  const customer = state.customers.find((c) => c.id === selected);
  return (
    <>
      <PageTitle
        eyebrow={tr('RELAÇÕES QUE CONTINUAM')}
        title={tr('Clientes e veículos')}
        description={tr('Cada visita faz parte de uma história. Encontre tudo por aqui.')}
        action={
          <Button
            variant="default"
            data-modal-return
            className="h-auto min-h-9 whitespace-normal"
            onClick={() => setCreate(true)}
          >
            <Plus size={17} />
            {tr('Novo cliente')}
          </Button>
        }
      />
      <Card className="min-w-0 gap-4 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
          <h2>
            {tr('Sua rede de clientes ')}
            <UiBadge variant="secondary">{state.customers.length}</UiBadge>
          </h2>
          <Label className="relative block min-w-0 flex-1 basis-64 [&>svg]:absolute [&>svg]:top-2.5 [&>svg]:left-3 [&>svg]:size-4 [&>svg]:text-muted-foreground [&>input]:h-9 [&>input]:pl-9 [&>kbd]:hidden">
            <Search size={17} />
            <Input
              type="search"
              aria-label={tr('Buscar clientes')}
              placeholder={tr('Nome, contato ou veículo…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Label>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id} className="gap-0 p-0">
              <Button
                variant="ghost"
                className="customer-card h-full w-full flex-col items-stretch justify-start whitespace-normal p-5 text-left [&_h3]:font-semibold [&_p]:text-sm [&_p]:font-normal [&_p]:text-muted-foreground"
                key={c.id}
                onClick={() => setSelected(c.id)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Avatar name={c.name} />
                  <ArrowUpRight size={17} />
                </div>
                <h3>{c.name}</h3>
                <p>{c.contact || tr('Sem contato informado')}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <CarFront size={15} />
                  {state.vehicles.filter((v) => v.customerId === c.id).length} {tr(' veículo(s)')}
                  <span>·</span>
                  {state.orders.filter((o) => o.customerId === c.id).length} {tr(' OS')}
                </div>
              </Button>
            </Card>
          ))}
        </div>
        {!rows.length && (
          <Empty
            title={tr('Nenhum cliente encontrado.')}
            description={tr('Tente outro nome, contato ou placa.')}
          />
        )}
      </Card>
      <Modal
        open={create}
        onOpenChange={setCreate}
        title={tr('Uma nova relação')}
        description={tr('Cadastre apenas o essencial. Depois, adicione os veículos ao cliente.')}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              commit((s) => {
                const c = customerSchema.parse({ id: uid(), name, contact });
                s.customers.push(c);
                return s;
              })
            ) {
              setCreate(false);
              setName('');
              setContact('');
              notify('Cliente fictício cadastrado.');
            }
          }}
        >
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Nome do cliente')}
            <Input
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('Nome fictício')}
            />
          </Label>
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Contato ')}
            <span className="text-xs font-normal text-muted-foreground">{tr('opcional')}</span>
            <Input
              maxLength={100}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={tr('E-mail ou telefone fictício')}
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
              onClick={() => setCreate(false)}
            >
              {tr('Voltar')}
            </Button>
            <Button variant="default" className="h-auto min-h-9 whitespace-normal">
              {tr('Cadastrar cliente')}
            </Button>
          </div>
        </form>
      </Modal>
      {customer && <CustomerDetail customer={customer} onClose={() => setSelected(null)} />}
    </>
  );
}
export function Receipts() {
  const { tr, money } = usePreferences();

  const { state } = useDemo();
  const [view, setView] = useState('pending');
  if (!state) return null;
  const orders = state.orders.filter((o) =>
    view === 'pending' ? balance(o) > 0 : o.payments.length > 0,
  );
  return (
    <>
      <PageTitle
        eyebrow={tr('CADA VALOR NO SEU LUGAR')}
        title={tr('Recebimentos')}
        description={tr('Acompanhe o que entrou e o que ainda está combinado.')}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="gap-3 p-6 [&>strong]:text-3xl [&>strong]:font-semibold [&>small]:text-muted-foreground">
          <Wallet size={24} />
          <span>{tr('Recebido na demonstração')}</span>
          <strong>{money(state.orders.reduce((n, o) => n + paid(o), 0))}</strong>
          <small>{tr('Lançamentos fictícios · sem integração bancária')}</small>
        </Card>
        <Card className="min-w-0 gap-4 p-5 sm:p-6 [&>strong]:text-3xl [&>strong]:font-semibold [&>small]:text-muted-foreground">
          <span>{tr('Saldo dos serviços aprovados')}</span>
          <strong>{money(state.orders.reduce((n, o) => n + balance(o), 0))}</strong>
          <small>{tr('Inclui veículos entregues com saldo pendente.')}</small>
        </Card>
      </div>
      <Card className="min-w-0 gap-4 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted-foreground">
          <h2>{tr('O financeiro de cada atendimento')}</h2>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            onValueChange={(value) => {
              if (value) setView(value);
            }}
            aria-label={tr('Recebimentos')}
          >
            <ToggleGroupItem value="pending">{tr('A receber')}</ToggleGroupItem>
            <ToggleGroupItem value="received">{tr('Com recebimentos')}</ToggleGroupItem>
          </ToggleGroup>
        </div>
        {orders.map((o) => {
          const { customer, vehicle } = orderContext(state, o);
          return (
            <div
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b py-5 last:border-0 lg:grid-cols-[auto_minmax(0,1fr)_auto_auto] [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground"
              key={o.id}
            >
              <Avatar name={customer.name} />
              <div>
                <strong>{customer.name}</strong>
                <small>
                  {vehicle.model} · {tr(o.title)}
                </small>
              </div>
              <div>
                <small>{view === 'pending' ? tr('Saldo pendente') : tr('Recebido')}</small>
                <strong>{money(view === 'pending' ? balance(o) : paid(o))}</strong>
              </div>
              <OrderLink id={o.id} number={o.number} />
            </div>
          );
        })}
        {!orders.length && (
          <Empty
            title={tr('Tudo tranquilo por aqui.')}
            description={tr('Nenhum atendimento corresponde a esta seleção.')}
          />
        )}
      </Card>
    </>
  );
}
export function Settings({ onRestore }: { onRestore: () => void }) {
  const { tr } = usePreferences();

  const { state, simulateFailure, notify } = useDemo();
  const [scenario, setScenario] = useState('normal');
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'patio-cenario-ficticio.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Cenário exportado em JSON.');
  }
  return (
    <>
      <PageTitle
        eyebrow={tr('SEU AMBIENTE DE EXPLORAÇÃO')}
        title={tr('Ajustes da demo')}
        description={tr(
          'Entenda o cenário, teste os estados da interface e recomece quando quiser.',
        )}
      />
      <div className="grid items-start gap-6 xl:grid-cols-2 [&_h2]:text-lg [&_h2]:font-semibold">
        <Card className="min-w-0 gap-4 p-5 sm:p-6 xl:col-span-2">
          <h2>{tr('Aparência e idioma')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr('Deixe o Pátio do seu jeito. Suas preferências ficam salvas neste navegador.')}
          </p>
          <PreferencesControls expanded />
        </Card>
        <Card className="min-w-0 gap-4 p-5 sm:p-6">
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <FlaskConical size={25} />
          </span>
          <h2>{tr('Uma oficina de demonstração')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr(
              'Você está no perfil fictício de Clara, gestora da Oficina Horizonte. Os registros ficam neste navegador e não são compartilhados com um servidor.',
            )}
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 [&>span]:text-muted-foreground">
            <span>{tr('Armazenamento')}</span>
            <strong>{tr('Local, no seu navegador')}</strong>
            <span>{tr('Dados')}</span>
            <strong>{tr('Sintéticos e restauráveis')}</strong>
            <span>{tr('Envios e pagamentos')}</span>
            <strong>{tr('Somente simulação')}</strong>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2 [&>*]:whitespace-normal [&>*]:h-auto [&>*]:min-h-9">
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={download}
            >
              <Download size={16} />
              {tr('Exportar cenário')}
            </Button>
            <ScenarioImport />
            <Button
              variant="outline"
              className="h-auto min-h-9 whitespace-normal"
              onClick={onRestore}
            >
              <RotateCcw size={16} />
              {tr('Restaurar cenário')}
            </Button>
          </div>
        </Card>
        <Card className="min-w-0 gap-4 p-5 sm:p-6">
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <AlertTriangle size={25} />
          </span>
          <h2>{tr('O cuidado também está nos erros')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr(
              'Teste uma falha de gravação: a próxima alteração será recusada uma vez. Seu formulário permanece disponível para tentar novamente.',
            )}
          </p>
          <Button
            variant="outline"
            className="h-auto min-h-9 whitespace-normal"
            onClick={simulateFailure}
          >
            {tr('Simular falha na próxima gravação')}
          </Button>
          <Alert role="note" className="my-3 block [&>svg]:inline [&>svg]:mr-2">
            {tr('Dica: ative a falha, abra uma OS e tente salvar uma revisão do orçamento.')}
          </Alert>
        </Card>
        <Card className="min-w-0 gap-4 p-5 sm:p-6 xl:col-span-2">
          <h2>{tr('Estados de interface')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tr(
              'Exemplos isolados para explorar acessibilidade e recuperação. Não alteram permissões reais.',
            )}
          </p>
          <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
            {tr('Estado a visualizar')}
            <NativeSelect
              className="w-full"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            >
              <NativeSelectOption value="normal">{tr('Tudo pronto')}</NativeSelectOption>
              <NativeSelectOption value="loading">{tr('Carregamento')}</NativeSelectOption>
              <NativeSelectOption value="empty">{tr('Lista vazia')}</NativeSelectOption>
              <NativeSelectOption value="error">{tr('Erro recuperável')}</NativeSelectOption>
              <NativeSelectOption value="permission">{tr('Acesso restrito')}</NativeSelectOption>
            </NativeSelect>
          </Label>
          <div className="rounded-lg border border-dashed p-5">
            {scenario === 'normal' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
                <CheckCircle2 size={27} />
                <h3>{tr('Tudo pronto para continuar.')}</h3>
                <p>{tr('O cenário está disponível para explorar.')}</p>
              </div>
            )}
            {scenario === 'loading' && (
              <div role="status" aria-label={tr('Carregando exemplo')}>
                <Skeleton className="h-28 w-full" />
                <p>{tr('Organizando os atendimentos…')}</p>
                <Button
                  variant="link"
                  className="h-auto min-h-9 whitespace-normal"
                  onClick={() => setScenario('normal')}
                >
                  {tr('Concluir simulação')}
                </Button>
              </div>
            )}
            {scenario === 'empty' && (
              <Empty
                title={tr('Seu primeiro veículo está por chegar.')}
                description={tr('Crie uma OS para começar o dia.')}
                action={
                  <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal">
                    <Link href="/demo/ordens/nova">{tr('Nova OS')}</Link>
                  </Button>
                }
              />
            )}
            {scenario === 'error' && (
              <div
                className="flex flex-col items-center gap-3 py-6 text-center [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground"
                role="alert"
              >
                <AlertTriangle size={27} />
                <h3>{tr('Não conseguimos carregar esta lista.')}</h3>
                <p>{tr('Os dados salvos continuam disponíveis.')}</p>
                <Button
                  variant="outline"
                  className="h-auto min-h-9 whitespace-normal"
                  onClick={() => setScenario('normal')}
                >
                  {tr('Tentar novamente')}
                </Button>
              </div>
            )}
            {scenario === 'permission' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center [&_h3]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
                <LockKeyhole size={27} />
                <h3>{tr('Este espaço é da gestão.')}</h3>
                <p>
                  {tr('Exemplo de acesso restrito. Papéis reais serão implementados no piloto.')}
                </p>
                <Button
                  variant="outline"
                  className="h-auto min-h-9 whitespace-normal"
                  onClick={() => setScenario('normal')}
                >
                  {tr('Voltar à demonstração')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
