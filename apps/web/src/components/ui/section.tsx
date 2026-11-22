import * as React from 'react';
import { cn } from '@/lib/utils';

export function Section({
  className,
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLElement> & { id?: string }) {
  return (
    <section id={id} className={cn('py-16 sm:py-24 relative overflow-hidden', className)} {...props}>
      {children}
    </section>
  );
}
