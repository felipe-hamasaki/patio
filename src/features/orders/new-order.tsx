'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { NativeSelectOption } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePreferences } from '@/lib/preferences';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  UserRound,
  CarFront,
  ClipboardCheck,
  Info,
} from 'lucide-react';
import { type Draft, createOrder, checklistLabels } from '@/lib/domain';
import { useDemo } from '@/lib/demo-store';
import { Check, PageTitle } from '@/components/patio-ui';

export function localInputDate(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function NewOrder({
  customerId = '',
  vehicleId = '',
}: {
  customerId?: string;
  vehicleId?: string;
}) {
  const { tr } = usePreferences();

  const { state, commit, notify } = useDemo(),
    router = useRouter();
  const [draft, setDraft] = useState<Draft>(
    () =>
      state?.draft ?? {
        customerId: state?.customers.some((c) => c.id === customerId) ? customerId : '',
        name: '',
        contact: '',
        vehicleId: state?.vehicles.some((v) => v.id === vehicleId && v.customerId === customerId)
          ? vehicleId
          : '',
        model: '',
        plate: '',
        year: String(new Date().getFullYear()),
        title: '',
        report: '',
        mileage: '',
        tech: 'Rafael',
        due: localInputDate(new Date(Date.now() + 86400000).toISOString()),
        checks: [false, false, false, false],
      },
  );
  const [saved, setSaved] = useState(!!state?.draft);
  if (!state) return null;
  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaved(commit((s) => ({ ...s, draft: next })));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    let id = '';
    if (
      commit((s) => {
        const next = createOrder(s, draft);
        id = next.orders[0].id;
        return next;
      })
    ) {
      notify('OS criada. Vamos cuidar deste veículo.');
      router.push(`/demo/ordens/${id}`);
    }
  }
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
      <PageTitle
        eyebrow={tr('UM NOVO ATENDIMENTO')}
        title={tr('Receber um veículo')}
        description={tr('Comece pelo essencial. O restante acompanha o serviço.')}
        action={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save size={15} />
            {saved ? tr('Rascunho salvo no navegador') : tr('Rascunho ainda não salvo')}
          </span>
        }
      />
      {state.draft &&
        customerId &&
        (draft.customerId !== customerId || (vehicleId && draft.vehicleId !== vehicleId)) && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"
            role="note"
          >
            <p>
              {tr(
                'Você já tem um rascunho. Ele foi preservado; descarte-o para iniciar este atendimento.',
              )}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                if (commit((s) => ({ ...s, draft: null }))) {
                  window.location.reload();
                }
              }}
            >
              {tr('Descartar rascunho')}
            </Button>
          </div>
        )}
      <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="contents xl:block xl:min-w-0 xl:space-y-6">
          <Card className="min-w-0 gap-4 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <UserRound size={21} />
              </span>
              <div>
                <h2>{tr('Quem está chegando?')}</h2>
                <p>{tr('Escolha um cliente ou faça um cadastro rápido.')}</p>
              </div>
              <span className="ml-auto text-sm tabular-nums text-muted-foreground">01</span>
            </div>
            <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
              {tr('Cliente')}
              <NativeSelect
                className="w-full"
                value={draft.customerId}
                onChange={(e) => update({ customerId: e.target.value, vehicleId: '' })}
              >
                <NativeSelectOption value="">{tr('Cadastrar novo cliente')}</NativeSelectOption>
                {state.customers.map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
            {!draft.customerId && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Nome do cliente ')}
                  <span className="text-destructive">*</span>
                  <Input
                    required
                    minLength={2}
                    maxLength={100}
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder={tr('Ex.: Fernanda Santos')}
                    autoComplete="off"
                  />
                </Label>
                <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                  {tr('Contato ')}
                  <span className="text-xs font-normal text-muted-foreground">
                    {tr('opcional')}
                  </span>
                  <Input
                    maxLength={100}
                    value={draft.contact}
                    onChange={(e) => update({ contact: e.target.value })}
                    placeholder={tr('E-mail ou telefone fictício')}
                  />
                </Label>
              </div>
            )}
          </Card>
          <Card className="min-w-0 gap-4 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CarFront size={21} />
              </span>
              <div>
                <h2>{tr('O veículo')}</h2>
                <p>{tr('Um histórico que começa na entrada.')}</p>
              </div>
              <span className="ml-auto text-sm tabular-nums text-muted-foreground">02</span>
            </div>
            {draft.customerId && (
              <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                {tr('Veículo do cliente')}
                <NativeSelect
                  className="w-full"
                  value={draft.vehicleId}
                  onChange={(e) => update({ vehicleId: e.target.value })}
                >
                  <NativeSelectOption value="">{tr('Cadastrar outro veículo')}</NativeSelectOption>
                  {state.vehicles
                    .filter((v) => v.customerId === draft.customerId)
                    .map((v) => (
                      <NativeSelectOption key={v.id} value={v.id}>
                        {v.model} · {v.plate}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </Label>
            )}
            {!draft.vehicleId && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                    {tr('Modelo ')}
                    <span className="text-destructive">*</span>
                    <Input
                      required
                      maxLength={100}
                      value={draft.model}
                      onChange={(e) => update({ model: e.target.value })}
                      placeholder={tr('Ex.: Honda Civic')}
                    />
                  </Label>
                  <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                    {tr('Placa fictícia ')}
                    <span className="text-destructive">*</span>
                    <Input
                      required
                      pattern="[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}"
                      title={tr('Formato ABC1D23 ou ABC1234, sem hífen')}
                      maxLength={7}
                      value={draft.plate}
                      onChange={(e) => update({ plate: e.target.value.toUpperCase() })}
                      placeholder="ABC1D23"
                    />
                  </Label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                    {tr('Ano ')}
                    <span className="text-destructive">*</span>
                    <Input
                      type="number"
                      required
                      min={1950}
                      max={2100}
                      value={draft.year}
                      onChange={(e) => update({ year: e.target.value })}
                    />
                  </Label>
                  <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                    {tr('Quilometragem ')}
                    <span className="text-destructive">*</span>
                    <Input
                      type="number"
                      required
                      min={0}
                      max={2000000}
                      value={draft.mileage}
                      onChange={(e) => update({ mileage: e.target.value })}
                      placeholder={tr('Ex.: 45000')}
                    />
                  </Label>
                </div>
              </>
            )}
            {draft.vehicleId && (
              <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                {tr('Quilometragem ')}
                <span className="text-destructive">*</span>
                <Input
                  type="number"
                  required
                  min={0}
                  max={2000000}
                  value={draft.mileage}
                  onChange={(e) => update({ mileage: e.target.value })}
                />
              </Label>
            )}
          </Card>
          <Card className="min-w-0 gap-4 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ClipboardCheck size={21} />
              </span>
              <div>
                <h2>{tr('A primeira conversa')}</h2>
                <p>{tr('Registre o que trouxe o cliente até aqui.')}</p>
              </div>
              <span className="ml-auto text-sm tabular-nums text-muted-foreground">03</span>
            </div>
            <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
              {tr('Resumo do serviço ')}
              <span className="text-destructive">*</span>
              <Input
                required
                maxLength={100}
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={tr('Ex.: Revisão de 40 mil quilômetros')}
              />
            </Label>
            <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
              {tr('Relato do cliente ')}
              <span className="text-destructive">*</span>
              <Textarea
                required
                maxLength={300}
                rows={3}
                value={draft.report}
                onChange={(e) => update({ report: e.target.value })}
                placeholder={tr('O que o cliente percebeu? O que precisa ser verificado?')}
              />
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                {tr('Responsável')}
                <NativeSelect
                  className="w-full"
                  value={draft.tech}
                  onChange={(e) => update({ tech: e.target.value as Draft['tech'] })}
                >
                  {['Rafael', 'Bruno', 'Camila'].map((t) => (
                    <NativeSelectOption key={t}>{t}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </Label>
              <Label className="block space-y-2 text-sm [&>input]:mt-2 [&>textarea]:mt-2 [&>[data-slot=native-select-wrapper]]:mt-2">
                {tr('Previsão de entrega ')}
                <span className="text-destructive">*</span>
                <Input
                  type="datetime-local"
                  required
                  value={draft.due}
                  onChange={(e) => update({ due: e.target.value })}
                />
              </Label>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-xs leading-relaxed text-muted-foreground">
              {tr(
                'Preencha no horário do seu dispositivo. Na operação, exibimos o horário de Brasília.',
              )}
            </p>
          </Card>
          <div className="order-2 flex justify-end gap-3 xl:order-none">
            <Button asChild variant="outline" className="h-auto min-h-9 whitespace-normal">
              <Link href="/demo/ordens">{tr('Voltar')}</Link>
            </Button>
            <Button variant="default" className="h-auto min-h-9 whitespace-normal" type="submit">
              {tr('Criar ordem de serviço')}
              <ArrowRight size={17} />
            </Button>
          </div>
        </div>
        <aside className="order-1 min-w-0 space-y-4 xl:order-none">
          <Card className="min-w-0 gap-4 p-5 sm:p-6">
            <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {tr('ANTES DE ESTACIONAR')}
            </div>
            <h2>{tr('Checklist de entrada')}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tr('Você pode concluir depois, antes de enviar o orçamento.')}
            </p>
            <div className="space-y-3">
              {checklistLabels.map((label, i) => (
                <Check
                  key={label}
                  checked={draft.checks[i]}
                  onChange={(v) =>
                    update({ checks: draft.checks.map((c, j) => (i === j ? v : c)) })
                  }
                >
                  {tr(label)}
                </Check>
              ))}
            </div>
            <Progress
              value={draft.checks.filter(Boolean).length * 25}
              aria-label={tr('Checklist de entrada')}
            />
            <small className="text-sm leading-relaxed text-muted-foreground">
              {draft.checks.filter(Boolean).length} {tr(' de 4 itens conferidos')}
            </small>
          </Card>
          <div className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground [&>svg]:shrink-0">
            <Info size={19} />
            <p>
              {tr(
                'Este é um ambiente de demonstração. Use apenas nomes, contatos e placas fictícios.',
              )}
            </p>
          </div>
          <div className="hidden space-y-3 rounded-xl border border-dashed p-6 text-center xl:block [&_p]:text-sm [&_p]:text-muted-foreground">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              p
            </span>
            <h3>{tr('O cuidado começa aqui.')}</h3>
            <p>{tr('Uma boa entrada deixa todo o caminho mais simples.')}</p>
          </div>
        </aside>
      </form>
    </>
  );
}
