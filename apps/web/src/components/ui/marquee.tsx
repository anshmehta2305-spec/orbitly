'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
}: {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:2rem] [gap:var(--gap)] select-none',
        className,
      )}
    >
      <div
        className={cn('flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-left', {
          '[animation-direction:reverse]': reverse,
          'group-hover:[animation-play-state:paused]': pauseOnHover,
        })}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn('flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-left', {
          '[animation-direction:reverse]': reverse,
          'group-hover:[animation-play-state:paused]': pauseOnHover,
        })}
      >
        {children}
      </div>
    </div>
  );
}
