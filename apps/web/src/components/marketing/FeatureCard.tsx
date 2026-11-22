import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  className = '',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}) {
  return (
    <Card
      className={`p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all duration-300 group ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-foreground">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
