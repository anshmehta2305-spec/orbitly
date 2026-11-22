'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  secondaryActionLabel,
  secondaryActionHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            actionHref ? (
              <Link href={actionHref}>
                <Button variant="default" size="sm" className="font-bold gap-2 shadow-md shadow-primary/20">
                  {actionLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onActionClick}
                className="font-bold gap-2 shadow-md shadow-primary/20"
              >
                {actionLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            )
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link href={secondaryActionHref}>
              <Button variant="outline" size="sm" className="font-semibold text-xs">
                {secondaryActionLabel}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
