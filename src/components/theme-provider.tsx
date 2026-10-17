'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="patio.theme"
      disableTransitionOnChange
    >
      <TooltipProvider>
        {children}
        <Toaster closeButton position="bottom-right" />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
