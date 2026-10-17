'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CarFront, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Modal, OrderLink } from '@/components/patio-ui';
import { useDemo } from '@/lib/demo-store';
import { usePreferences } from '@/lib/preferences';
import { saveCustomer, saveVehicle, uid, type Customer, type Vehicle } from '@/lib/domain';

export function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { tr, dateTime } = usePreferences();
  const { state } = useDemo();
  const [editor, setEditor] = useState<'customer' | 'vehicle' | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | undefined>();
  if (!state) return null;
  const vehicles = state.vehicles.filter((v) => v.customerId === customer.id);
  const orders = state.orders.filter((o) => o.customerId === customer.id);
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={customer.name}
      description={customer.contact || tr('Contato não informado')}
      wide
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setEditor('customer')}>
          <Pencil />
          {tr('Editar cliente')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setVehicle(undefined);
            setEditor('vehicle');
          }}
        >
          <Plus />
          {tr('Adicionar veículo')}
        </Button>
      </div>
      <h3 className="mt-6 mb-3 font-semibold">{tr('Veículos')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {vehicles.map((v) => {
          const active = orders.find(
            (o) => o.vehicleId === v.id && !['delivered', 'cancelled'].includes(o.stage),
          );
          return (
            <div className="min-w-0 space-y-3 rounded-lg border p-4" key={v.id}>
              <div className="flex items-start gap-3">
                <CarFront className="shrink-0" />
                <div className="min-w-0">
                  <strong className="block break-words">
                    {v.model} · {v.year}
                  </strong>
                  <span className="font-mono text-xs text-muted-foreground">{v.plate}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={tr('Editar veículo {0}', { 0: v.plate })}
                  onClick={() => {
                    setVehicle(v);
                    setEditor('vehicle');
                  }}
                >
                  <Pencil />
                  {tr('Editar veículo')}
                </Button>
                {active ? (
                  <OrderLink id={active.id} number={active.number} />
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/demo/ordens/nova?cliente=${customer.id}&veiculo=${v.id}`}
                      onClick={onClose}
                    >
                      {tr('Criar atendimento')}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!vehicles.length && (
        <p className="text-sm text-muted-foreground">
          {tr('Nenhum veículo cadastrado. Adicione o primeiro para começar.')}
        </p>
      )}
      <h3 className="mt-6 font-semibold">{tr('Histórico de atendimentos')}</h3>
      {orders.map((o) => (
        <div className="flex flex-wrap items-center gap-3 border-b py-4 last:border-0" key={o.id}>
          <div className="min-w-0 flex-1">
            <strong>{tr(o.title)}</strong>
            <small className="block text-xs text-muted-foreground">{dateTime(o.createdAt)}</small>
          </div>
          <OrderLink id={o.id} number={o.number} />
        </div>
      ))}
      {!orders.length && (
        <p className="mt-3 text-sm text-muted-foreground">
          {tr('A primeira visita ainda está por vir.')}
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button asChild>
          <Link href={`/demo/ordens/nova?cliente=${customer.id}`} onClick={onClose}>
            <Plus />
            {tr('Criar atendimento')}
          </Link>
        </Button>
      </div>
      {editor && (
        <RegistrationEditor
          customer={customer}
          vehicle={vehicle}
          kind={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </Modal>
  );
}

function RegistrationEditor({
  customer,
  vehicle,
  kind,
  onClose,
}: {
  customer: Customer;
  vehicle?: Vehicle;
  kind: 'customer' | 'vehicle';
  onClose: () => void;
}) {
  const { tr } = usePreferences();
  const { commit, notify, error } = useDemo();
  // Keep the original snapshot so another tab cannot be overwritten by a stale form.
  const [originalCustomer] = useState(customer);
  const [originalVehicle] = useState(vehicle);
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contact);
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [plate, setPlate] = useState(vehicle?.plate ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const fieldClass = 'block space-y-2 [&>input]:mt-2';
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={tr(
        kind === 'customer' ? 'Editar cliente' : vehicle ? 'Editar veículo' : 'Adicionar veículo',
      )}
      description={tr('Use dados fictícios. As alterações ficam salvas neste navegador.')}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const saved = commit((s) =>
            kind === 'customer'
              ? saveCustomer(s, { id: customer.id, name, contact }, originalCustomer)
              : saveVehicle(
                  s,
                  {
                    id: originalVehicle?.id ?? uid(),
                    customerId: customer.id,
                    model,
                    plate,
                    year: Number(year),
                  },
                  originalVehicle,
                ),
          );
          if (saved) {
            notify('Cadastro salvo.');
            onClose();
          }
        }}
      >
        {kind === 'customer' ? (
          <>
            <Label className={fieldClass}>
              {tr('Nome do cliente')}
              <Input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Label>
            <Label className={fieldClass}>
              {tr('Contato')}
              <Input maxLength={100} value={contact} onChange={(e) => setContact(e.target.value)} />
            </Label>
          </>
        ) : (
          <>
            <Label className={fieldClass}>
              {tr('Modelo')}
              <Input
                required
                maxLength={300}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className={fieldClass}>
                {tr('Placa fictícia')}
                <Input
                  required
                  maxLength={8}
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="ABC1D23"
                />
              </Label>
              <Label className={fieldClass}>
                {tr('Ano')}
                <Input
                  required
                  type="number"
                  min={1950}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </Label>
            </div>
          </>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            {tr(error)}
          </Alert>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {tr('Voltar')}
          </Button>
          <Button type="submit">{tr('Salvar cadastro')}</Button>
        </div>
      </form>
    </Modal>
  );
}
