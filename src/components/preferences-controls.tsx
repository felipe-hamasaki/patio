'use client';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useId } from 'react';
import { usePreferences } from '@/lib/preferences';
import type { Locale, Theme } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export function PreferencesControls({ expanded = false }: { expanded?: boolean }) {
  const { locale, theme, setLocale, setTheme, tr, storageError, ready } = usePreferences();
  const id = useId();
  const toggleLabel = tr(theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
  return (
    <div
      className={
        expanded ? 'grid max-w-xl gap-4 sm:grid-cols-2' : 'flex shrink-0 items-center gap-1'
      }
    >
      <div className={expanded ? 'space-y-2' : ''}>
        <Label htmlFor={`${id}-locale`} className={expanded ? '' : 'sr-only'}>
          {tr('Idioma')}
        </Label>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              id={`${id}-locale`}
              variant="outline"
              disabled={!ready}
              aria-label={tr('Idioma')}
              className={`gap-2 rounded-lg bg-background px-2.5 shadow-none ${expanded ? 'w-full justify-between' : 'h-9'}`}
            >
              <span className={expanded ? 'flex-1 text-left' : 'text-xs font-medium'}>
                {expanded
                  ? locale === 'pt-BR'
                    ? 'Português (Brasil)'
                    : 'English'
                  : locale === 'pt-BR'
                    ? 'PT'
                    : 'EN'}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className={expanded ? '' : 'min-w-20'}>
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(value) => setLocale(value as Locale)}
            >
              {(
                [
                  ['pt-BR', 'PT', 'Português'],
                  ['en-US', 'EN', 'English'],
                ] as const
              ).map(([value, code, name]) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  lang={value}
                  aria-label={name}
                  className="cursor-pointer py-1.5 pl-2 data-[state=checked]:bg-accent"
                >
                  {expanded ? name : code}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded ? (
        <div className="space-y-2">
          <Label htmlFor={`${id}-theme`}>{tr('Tema')}</Label>
          <NativeSelect
            id={`${id}-theme`}
            className="w-full"
            disabled={!ready}
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <NativeSelectOption value="light">{tr('Claro')}</NativeSelectOption>
            <NativeSelectOption value="dark">{tr('Escuro')}</NativeSelectOption>
          </NativeSelect>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!ready}
              aria-label={toggleLabel}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{toggleLabel}</TooltipContent>
        </Tooltip>
      )}
      {storageError && (
        <span
          className={expanded ? 'text-xs text-muted-foreground sm:col-span-2' : 'sr-only'}
          role="status"
        >
          {tr('Preferências válidas apenas nesta sessão: o navegador bloqueou o armazenamento.')}
        </span>
      )}
    </div>
  );
}
