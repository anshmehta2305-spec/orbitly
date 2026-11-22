import React from 'react';

export default function AppLoading() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Top progress indicator */}
      <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-cyan-400 to-primary bg-[length:200%_100%] animate-pulse" />
      </div>

      {/* Main Content Skeleton Area */}
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted/60 rounded-lg" />
            <div className="h-4 w-72 bg-muted/40 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-muted/50 rounded-xl" />
            <div className="h-9 w-32 bg-primary/20 rounded-xl" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-3">
              <div className="h-4 w-24 bg-muted/50 rounded" />
              <div className="h-7 w-20 bg-muted/70 rounded-lg" />
              <div className="h-3 w-36 bg-muted/30 rounded" />
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <div className="h-5 w-40 bg-muted/60 rounded" />
            <div className="h-64 bg-muted/20 rounded-xl border border-dashed border-border/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-4">
            <div className="h-5 w-32 bg-muted/60 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/30 space-y-2">
                  <div className="h-3.5 w-full bg-muted/50 rounded" />
                  <div className="h-3 w-2/3 bg-muted/30 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
