'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function Accordion({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('w-full divide-y divide-border', className)}>{children}</div>;
}

export function AccordionItem({
  value,
  title,
  children,
  defaultOpen = false,
}: {
  value?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-semibold transition-all hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground', {
            'rotate-180 text-primary': isOpen,
          })}
        />
      </button>
      {isOpen && (
        <div className="pt-2 pb-1 text-sm text-muted-foreground animate-in fade-in-50 duration-200 px-1 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
