'use client';

import { useId, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowUpRight, CarFront, SearchX } from 'lucide-react';
import { usePreferences } from '@/lib/preferences';
import { type Stage, stageLabels } from '@/lib/domain';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Avatar as UiAvatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Empty as UiEmpty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

// Domain compositions only. All visual primitives live in components/ui (shadcn).
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { tr } = usePreferences();
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('max-h-[90dvh] overflow-y-auto p-6', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
        onOpenAutoFocus={() => {
          previousFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          if (previousFocus.current?.isConnected) {
            event.preventDefault();
            previousFocus.current.focus({ preventScroll: true });
          }
        }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{tr(title)}</DialogTitle>
          <DialogDescription>{tr(description)}</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label={tr('Fechar janela')}
          >
            <X />
          </Button>
        </DialogClose>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export const stageColors: Record<Stage, string> = {
  diagnosis: 'bg-diagnostic text-diagnostic-foreground',
  approval: 'bg-warning text-warning-foreground',
  execution: 'bg-info text-info-foreground',
  ready: 'bg-success text-success-foreground',
  delivered: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-danger text-danger-foreground',
};

export function Badge({ stage }: { stage: Stage }) {
  const { tr } = usePreferences();
  return (
    <UiBadge className={cn('badge', stageColors[stage])} variant="secondary">
      {tr(stageLabels[stage])}
    </UiBadge>
  );
}
export function Empty({
  title = 'Nenhuma OS por aqui.',
  description = 'Ajuste os filtros ou receba o próximo veículo.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { tr } = usePreferences();
  return (
    <UiEmpty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>
          <h3>{tr(title)}</h3>
        </EmptyTitle>
        <EmptyDescription>{tr(description)}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </UiEmpty>
  );
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <UiAvatar className={small ? 'size-7' : 'size-9'} aria-hidden="true">
      <AvatarFallback className="bg-accent text-xs text-accent-foreground">
        {name
          .split(' ')
          .map((x) => x[0])
          .slice(0, 2)
          .join('')}
      </AvatarFallback>
    </UiAvatar>
  );
}
export function VehicleIcon() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
      <CarFront className="size-5" />
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { tr } = usePreferences();
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium tracking-wide text-primary uppercase">
          {tr(eyebrow)}
        </p>
        <h1
          tabIndex={-1}
          id="page-title"
          className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
        >
          {tr(title)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(description)}</p>
      </div>
      {action}
    </div>
  );
}
export function OrderLink({ id, number }: { id: string; number: number }) {
  const { tr } = usePreferences();
  return (
    <Button asChild variant="link" className="px-0">
      <Link href={`/demo/ordens/${id}`}>
        {tr('OS #')}
        {number}
        <ArrowUpRight />
      </Link>
    </Button>
  );
}
export function Check({
  checked,
  onChange,
  children,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <Label
        htmlFor={id}
        className="block min-w-0 cursor-pointer text-sm leading-relaxed [&_strong]:block [&_small]:block [&_small]:font-normal [&_small]:text-muted-foreground"
      >
        {children}
      </Label>
    </div>
  );
}
export function DemoNotice() {
  const { tr } = usePreferences();
  return <UiBadge variant="outline">{tr('Modo demonstração')}</UiBadge>;
}
