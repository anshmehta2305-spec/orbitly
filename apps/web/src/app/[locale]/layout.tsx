import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, isRtlLocale } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://orbitly.app'),
  title: {
    default: 'Orbitly — Plan once. Publish everywhere.',
    template: '%s | Orbitly',
  },
  description:
    'The all-in-one social media scheduling and publishing platform for creators, agencies, and marketing teams worldwide.',
  keywords: [
    'social media scheduler',
    'cross-platform posting',
    'social media calendar',
    'AI social captions',
    'LinkedIn scheduler',
    'Instagram publisher',
    'Threads scheduler',
  ],
  authors: [{ name: 'Orbitly Global Team' }],
  openGraph: {
    title: 'Orbitly — Plan once. Publish everywhere.',
    description:
      'Plan, create, schedule and publish content across every major network from one beautiful command center.',
    url: 'https://orbitly.app',
    siteName: 'Orbitly',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbitly — Plan once. Publish everywhere.',
    description:
      'Plan, create, schedule and publish content across every major network from one beautiful command center.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = isRtlLocale(locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
