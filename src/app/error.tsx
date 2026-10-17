'use client';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/lib/preferences';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { tr } = usePreferences();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 p-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_p]:text-muted-foreground">
      <h1>{tr('Vamos tentar de novo?')}</h1>
      <p>{tr('Não foi possível abrir a tela. Seus dados salvos continuam neste navegador.')}</p>
      <Button variant="default" className="h-auto min-h-9 whitespace-normal" onClick={reset}>
        {tr('Tentar novamente')}
      </Button>
    </main>
  );
}
