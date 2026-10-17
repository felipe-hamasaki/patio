import { Patio } from '@/components/patio';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug?: string[] }> };
const pages: Record<string, string> = {
  '': 'Visão do pátio',
  ordens: 'Ordens de serviço',
  clientes: 'Clientes e veículos',
  recebimentos: 'Recebimentos',
  ajustes: 'Ajustes da demo',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const title =
    slug.length === 2 && slug[0] === 'ordens'
      ? slug[1] === 'nova'
        ? 'Nova ordem de serviço'
        : 'Detalhe do atendimento'
      : (pages[slug.join('/')] ?? 'Página não encontrada');
  return { title: `${title} · Pátio` };
}

export default async function Demo({ params }: Props) {
  const { slug = [] } = await params;
  if (!(slug.join('/') in pages) && !(slug.length === 2 && slug[0] === 'ordens')) notFound();
  return <Patio />;
}
