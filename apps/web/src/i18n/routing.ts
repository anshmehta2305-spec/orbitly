import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

export const RTL_LOCALES = ['ar'] as const;
export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale as any);
}
