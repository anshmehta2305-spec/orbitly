'use client';

import * as React from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English (US)',
  hi: 'हिन्दी (Hindi)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  pt: 'Português (BR)',
  ar: 'العربية (Arabic)',
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border px-2.5 py-1 rounded-lg">
      <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
      <select
        value={currentLocale}
        onChange={handleChange}
        className="bg-transparent text-xs font-medium cursor-pointer outline-none focus:ring-0 text-foreground"
        aria-label="Select language"
      >
        {Object.entries(LANGUAGE_LABELS).map(([code, name]) => (
          <option key={code} value={code} className="bg-card text-foreground">
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
