import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function CtaBanner({ locale }: { locale: string }) {
  return (
    <div className="relative rounded-3xl border border-primary/30 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-background p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>Launch Your Social Command Center Today</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Ready to plan once and publish everywhere?
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
          Join thousands of creators, agencies, and global marketing teams streamlining their workflow with
          Orbitly. Start your free tier with zero setup fee.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={`/${locale}/signup`}>
            <Button variant="gradient" size="lg" className="text-sm font-bold shadow-xl shadow-indigo-500/25">
              <span>Start Free Now</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href={`/${locale}/pricing`}>
            <Button
              variant="outline"
              size="lg"
              className="text-sm font-semibold bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              View All Plans
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 pt-2">No credit card required • Instant 1-minute setup • Cancel anytime</p>
      </div>
    </div>
  );
}
