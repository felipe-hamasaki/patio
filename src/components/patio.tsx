'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  UsersRound,
  Wallet,
  SlidersHorizontal,
  ArrowUpRight,
  RotateCcw,
  CircleHelp,
  AlertCircle,
  Sprout,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';
import { translate } from '@/lib/i18n';
import { useDemo } from '@/lib/demo-store';
import { Modal, Avatar, DemoNotice, Empty } from './patio-ui';
import { Overview } from '@/features/orders/overview';
import { NewOrder } from '@/features/orders/new-order';
import { OrderDetail } from '@/features/orders/detail';
import { Customers, Receipts, Settings } from '@/features/workspace';
import { PreferencesControls } from './preferences-controls';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
const nav = [
  { href: '/demo', label: 'Visão do pátio', icon: LayoutDashboard },
  { href: '/demo/ordens', label: 'Ordens de serviço', icon: ClipboardList },
  { href: '/demo/clientes', label: 'Clientes e veículos', icon: UsersRound },
  { href: '/demo/recebimentos', label: 'Recebimentos', icon: Wallet },
];
export function Patio() {
  return (
    <SidebarProvider>
      <Shell />
    </SidebarProvider>
  );
}
function Shell() {
  const { tr, locale } = usePreferences();
  const path = usePathname(),
    router = useRouter(),
    searchParams = useSearchParams();
  const { state, error, message, reset, reload } = useDemo();
  const { setOpenMobile, isMobile } = useSidebar();
  const [restore, setRestore] = useState(false),
    [help, setHelp] = useState(false);
  const lastMessage = useRef('');
  useEffect(() => {
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [path]);
  useEffect(() => {
    if (message && message !== lastMessage.current) toast.success(tr(message));
    lastMessage.current = message;
  }, [message, tr]);
  const detailId = path.startsWith('/demo/ordens/') ? path.split('/').at(-1) : null;
  const current =
    nav.find((n) => n.href === path)?.label ??
    (detailId === 'nova'
      ? 'Nova ordem de serviço'
      : detailId
        ? 'Detalhe do atendimento'
        : 'Ajustes da demo');
  const closeNavigation = () => setOpenMobile(false);
  useEffect(() => {
    document.title = `${translate(current, locale)} · Pátio`;
  }, [current, locale]);
  return (
    <>
      <a
        href="#main"
        className="sr-only fixed top-2 left-2 z-50 rounded-md bg-background p-3 focus:not-sr-only"
      >
        {tr('Pular para o conteúdo')}
      </a>
      <Sidebar
        mobileTitle={tr('Navegação da oficina')}
        mobileDescription={tr('Navegação principal')}
        variant="inset"
        className="sidebar"
      >
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Link
              href="/demo"
              onClick={closeNavigation}
              aria-label={tr('Pátio, início')}
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                p
              </span>
              pátio.
            </Link>
            {isMobile && (
              <Button
                size="icon"
                variant="ghost"
                onClick={closeNavigation}
                aria-label={tr('Fechar navegação')}
              >
                <X />
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
            <Sprout className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{tr('Oficina Horizonte')}</p>
              <p className="text-xs text-muted-foreground">{tr('Seu espaço de trabalho')}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{tr('GESTÃO DA OFICINA')}</SidebarGroupLabel>
            <nav aria-label={tr('Navegação principal')}>
              <SidebarMenu>
                {nav.map((n) => (
                  <SidebarMenuItem key={n.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={n.href === '/demo' ? path === n.href : path.startsWith(n.href)}
                      className="h-10"
                    >
                      <Link
                        href={n.href}
                        onClick={closeNavigation}
                        aria-current={path === n.href ? 'page' : undefined}
                      >
                        <n.icon />
                        <span>{tr(n.label)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {n.href === '/demo/ordens' && state && (
                      <SidebarMenuBadge>
                        {
                          state.orders.filter((o) => !['delivered', 'cancelled'].includes(o.stage))
                            .length
                        }
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-4 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={path === '/demo/ajustes'}>
                <Link href="/demo/ajustes" onClick={closeNavigation}>
                  <SlidersHorizontal />
                  {tr('Ajustes da demo')}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  closeNavigation();
                  setHelp(true);
                }}
              >
                <CircleHelp />
                {tr('Como usar a demo ')}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  closeNavigation();
                  setRestore(true);
                }}
              >
                <RotateCcw />
                {tr('Restaurar cenário')}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar name="Clara Ferreira" />
            <div>
              <p className="text-sm font-medium">Clara Ferreira</p>
              <p className="text-xs text-muted-foreground">{tr('Gestora · perfil fictício')}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="topbar flex min-h-16 items-center gap-2 border-b px-3 sm:gap-4 sm:px-6">
          <SidebarTrigger
            aria-label={tr(isMobile ? 'Abrir navegação' : 'Alternar navegação lateral')}
          />
          <Separator orientation="vertical" className="h-4!" />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden lg:block">
                <BreadcrumbLink asChild>
                  <Link href="/demo">Workspace</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden lg:block" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate text-xs sm:text-sm">
                  {tr(current)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <PreferencesControls />
          <span className="hidden 2xl:block">
            <DemoNotice />
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr('Ajuda da demonstração')}
                onClick={() => setHelp(true)}
              >
                <CircleHelp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tr('Ajuda da demonstração')}</TooltipContent>
          </Tooltip>
        </header>
        <div className="flex flex-wrap justify-between gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <span>{tr('Seu espaço para experimentar. Todos os dados são fictícios.')}</span>
          <span className="hidden lg:block">{tr('Salvo neste navegador')}</span>
        </div>
        <div id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8">
          {error && (
            <Alert variant="destructive" className="error-banner mb-6">
              <AlertCircle />
              <AlertTitle>{tr('Não foi possível concluir')}</AlertTitle>
              <AlertDescription>
                <p>{tr(error)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={reload}>
                    {tr('Recarregar dados')}
                  </Button>
                  <Button variant="ghost" onClick={() => setRestore(true)}>
                    {tr('Restaurar demo')}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {!state ? (
            <div role="status" className="space-y-5">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-80 w-full" />
              <span className="text-sm text-muted-foreground">{tr('Preparando seu pátio…')}</span>
            </div>
          ) : detailId === 'nova' ? (
            <NewOrder
              key={searchParams.toString()}
              customerId={searchParams.get('cliente') ?? ''}
              vehicleId={searchParams.get('veiculo') ?? ''}
            />
          ) : detailId ? (
            <OrderDetail key={detailId} id={detailId} />
          ) : path === '/demo/clientes' ? (
            <Customers />
          ) : path === '/demo/recebimentos' ? (
            <Receipts />
          ) : path === '/demo/ajustes' ? (
            <Settings onRestore={() => setRestore(true)} />
          ) : ['/demo', '/demo/ordens'].includes(path) ? (
            <Overview ordersOnly={path.endsWith('/ordens')} />
          ) : (
            <Empty
              title={tr('Página não encontrada')}
              action={
                <Button asChild>
                  <Link href="/demo">{tr('Voltar ao pátio')}</Link>
                </Button>
              }
            />
          )}
          <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
            <span>pátio. {tr(' Menos planilhas. Mais oficina.')}</span>
            <span>{tr('Pátio · demonstração de portfólio')}</span>
          </footer>
        </div>
      </SidebarInset>
      <AlertDialog open={restore} onOpenChange={setRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Um novo começo no pátio?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                'Isso substitui as alterações, os recebimentos e os rascunhos locais pelos seis atendimentos de exemplo.',
              )}{' '}
              {tr('A restauração afeta somente este navegador. Esta ação não pode ser desfeita.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr('Manter meu cenário')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reset()) router.push('/demo');
              }}
            >
              {tr('Restaurar demonstração')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Modal
        open={help}
        onOpenChange={setHelp}
        title="Seu primeiro giro pelo Pátio"
        description="Uma jornada de cerca de três minutos, sem cadastro e sem envios reais."
      >
        <ol className="list-decimal space-y-4 pl-5 text-sm">
          {[
            ['Comece pela OS #1042', 'Abra o Honda Fit e veja o orçamento na aba Orçamento.'],
            [
              'Experimente o lado do cliente',
              'Abra a aprovação simulada e escolha os itens que deseja autorizar.',
            ],
            [
              'Conecte o restante do serviço',
              'Conclua os itens na execução, confira o veículo e registre sua entrega.',
            ],
            [
              'Crie seu próprio atendimento',
              'Cadastre uma nova OS. Os dados ficam salvos ao atualizar a página.',
            ],
          ].map(([title, description]) => (
            <li key={title}>
              <strong>{tr(title)}</strong>
              <p className="mt-1 text-muted-foreground">{tr(description)}</p>
            </li>
          ))}
        </ol>
        <Button
          onClick={() => {
            setHelp(false);
            router.push('/demo/ordens/1042');
          }}
        >
          {tr('Explorar a OS #1042 ')}
          <ArrowUpRight />
        </Button>
      </Modal>
    </>
  );
}
