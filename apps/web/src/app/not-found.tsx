'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
      </div>

      <span className="text-xs uppercase font-extrabold tracking-widest text-primary mb-2">404 Error</span>
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
        Out of Orbital Range
      </h1>

      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        The destination you are trying to reach has moved or drifted beyond the planetary horizon.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="gradient" size="sm" className="text-xs font-semibold">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Return to Mission Control</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
