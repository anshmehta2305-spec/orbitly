'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app boundary error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs uppercase font-extrabold tracking-widest text-destructive mb-2">500 Server Error</span>
      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
        Telemetry Signal Interrupted
      </h1>

      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        An unexpected error occurred while processing your request. Our automated diagnostics have been notified.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="gradient" size="sm" onClick={() => reset()} className="text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reload View</span>
        </Button>
      </div>
    </div>
  );
}
