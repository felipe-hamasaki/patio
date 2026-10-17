'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/patio-ui';
import { useDemo } from '@/lib/demo-store';
import { usePreferences } from '@/lib/preferences';
import { parseBackup, type State } from '@/lib/domain';

export function ScenarioImport() {
  const { tr } = usePreferences();
  const { state, importBackup, error } = useDemo();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    raw: string;
    name: string;
    data: State;
    revision: number;
  } | null>(null);
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  return (
    <>
      <input
        ref={input}
        className="sr-only"
        tabIndex={-1}
        aria-label={tr('Arquivo de cenário')}
        type="file"
        accept="application/json,.json"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file || !state) return;
          setFileError('');
          setPending(null);
          setReading(true);
          try {
            if (file.size > 2 * 1024 * 1024)
              throw new Error('Use um arquivo de cenário de até 2 MB.');
            const raw = await file.text();
            setPending({ raw, name: file.name, data: parseBackup(raw), revision: state.revision });
          } catch (e) {
            setFileError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
          } finally {
            setReading(false);
          }
        }}
      />
      <Button
        variant="outline"
        className="h-auto min-h-9 whitespace-normal"
        disabled={reading || !state}
        onClick={() => input.current?.click()}
      >
        <Upload />
        {tr(reading ? 'Lendo arquivo…' : 'Importar cenário')}
      </Button>
      {fileError && (
        <Alert variant="destructive" role="alert">
          {tr(fileError)}
        </Alert>
      )}
      <Modal
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={tr('Importar este cenário?')}
        description={tr(
          'O arquivo substituirá os registros e rascunhos deste navegador. Exporte o cenário atual se quiser guardá-lo.',
        )}
      >
        {pending && (
          <>
            <p className="break-all text-sm font-medium">{pending.name}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <dt>{tr('Clientes')}</dt>
              <dd>{pending.data.customers.length}</dd>
              <dt>{tr('Veículos')}</dt>
              <dd>{pending.data.vehicles.length}</dd>
              <dt>{tr('Ordens de serviço')}</dt>
              <dd>{pending.data.orders.length}</dd>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              {tr('Idioma e aparência serão mantidos. Nenhum dado será enviado a um servidor.')}
            </p>
            {error && (
              <Alert className="mt-4" variant="destructive" role="alert">
                {tr(error)}
              </Alert>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setPending(null)}>
                {tr('Voltar')}
              </Button>
              <Button
                onClick={() => {
                  if (importBackup(pending.raw, pending.revision)) setPending(null);
                }}
              >
                {tr('Substituir pelo arquivo')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
