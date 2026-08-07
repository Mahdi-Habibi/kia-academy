import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { ClientProviders } from '@/components/layout/ClientProviders';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { DEFAULT_LOCALE, dirForLocale } from '@/i18n/locales';
import { messages } from '@/i18n/messages';
import '@/styles/globals.css';

/** Site-wide Persian UI font (FaNum = Persian digits). */
const yekanBakh = localFont({
  src: [
    { path: './fonts/yekanbakh/YekanBakhFaNum-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/yekanbakh/YekanBakhFaNum-Regular.woff2', weight: '500', style: 'normal' },
    { path: './fonts/yekanbakh/YekanBakhFaNum-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/yekanbakh/YekanBakhFaNum-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/yekanbakh/YekanBakhFaNum-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: './fonts/yekanbakh/YekanBakhFaNum-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-yekanbakh',
  display: 'swap',
  adjustFontFallback: false,
});

/** Landing hero title only. */
const pelak = localFont({
  src: [
    { path: './fonts/pelak/PelakFA-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/pelak/PelakFA-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/pelak/PelakFA-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/pelak/PelakFA-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/pelak/PelakFA-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: './fonts/pelak/PelakFA-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-pelak',
  display: 'swap',
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: messages[DEFAULT_LOCALE].meta.title,
  description: messages[DEFAULT_LOCALE].meta.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/logo-mark.svg', type: 'image/svg+xml' }],
  },
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
      className={`${yekanBakh.variable} ${pelak.variable} ${jetbrainsMono.variable}`}
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
