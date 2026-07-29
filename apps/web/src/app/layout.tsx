import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Sora, Vazirmatn } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { DEFAULT_LOCALE, dirForLocale } from '@/i18n/locales';
import { messages } from '@/i18n/messages';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  weight: ['400', '500', '600', '700', '800'],
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: messages[DEFAULT_LOCALE].meta.title,
  description: messages[DEFAULT_LOCALE].meta.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1626' },
  ],
};

/**
 * Locale is resolved on the client (LanguageProvider) so this layout stays
 * compatible with `output: 'export'` / GitHub Pages. Reading `cookies()` here
 * marks every route dynamic and breaks the Pages static build.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = DEFAULT_LOCALE;
  const dir = dirForLocale(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${vazirmatn.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <ClientProviders initialLocale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </ClientProviders>
      </body>
    </html>
  );
}
