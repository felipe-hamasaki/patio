import type { Metadata } from 'next';
import './globals.css';
import { PreferencesProvider } from '@/lib/preferences';
import { ThemeProvider } from '@/components/theme-provider';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3002',
  ),
  title: 'Pátio · Gestão de oficinas',
  description: 'Cada serviço, no seu ritmo. Uma demonstração interativa de gestão de oficinas.',
  robots: { index: false, follow: false },
  applicationName: 'Pátio',
  openGraph: {
    title: 'Pátio · Gestão de oficinas',
    description:
      'Explore uma oficina do início à entrega. Demo interativa de portfólio, sem cadastro.',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem('patio.preferences.v1')||'{}');document.documentElement.dataset.theme=p.theme==='dark'?'dark':'light';document.documentElement.lang=p.locale==='en-US'?'en-US':'pt-BR'}catch{}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <PreferencesProvider>{children}</PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
