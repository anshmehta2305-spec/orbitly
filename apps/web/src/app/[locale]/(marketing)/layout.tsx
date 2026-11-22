import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { CookieConsentBanner } from '@/components/ui/cookie-banner';

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar locale={locale} />
      <div className="flex-1 pt-20">{children}</div>
      <Footer locale={locale} />
      <CookieConsentBanner locale={locale} />
    </div>
  );
}
