'use client';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/lib/preferences';
import Link from 'next/link';
export default function NotFound() {
  const { tr } = usePreferences();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 p-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_p]:text-muted-foreground">
      <h1>{tr('Este caminho não leva ao pátio.')}</h1>
      <p>{tr('A página não foi encontrada.')}</p>
      <Button asChild variant="default" className="h-auto min-h-9 whitespace-normal">
        <Link className="" href="/demo">
          {tr('Voltar à operação')}
        </Link>
      </Button>
    </main>
  );
}
