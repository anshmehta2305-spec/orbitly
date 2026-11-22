import React from 'react';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatarInitial,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarInitial: string;
}) {
  return (
    <Card className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md flex flex-col justify-between space-y-4">
      {/* 5 Stars */}
      <div className="flex items-center gap-1 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current" />
        ))}
      </div>

      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">"{quote}"</p>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
          {avatarInitial}
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">{author}</h4>
          <p className="text-[11px] text-muted-foreground">
            {role} • <span className="font-medium text-foreground">{company}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
