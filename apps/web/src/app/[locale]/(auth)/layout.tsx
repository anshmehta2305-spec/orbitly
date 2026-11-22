import React from 'react';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import Link from 'next/link';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link href={`/${locale}/dashboard`} className="transition-transform hover:scale-105">
          <OrbitlyLogo size={36} />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="flex-1 flex items-center justify-center py-10 w-full max-w-md mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4">
        &copy; {new Date().getFullYear()} Orbitly. Plan once. Publish everywhere. All rights reserved.
      </footer>
    </div>
  );
}
