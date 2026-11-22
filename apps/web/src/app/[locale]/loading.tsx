import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      {/* Top progress bar with animated gradient pulse */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite_linear]" />
    </div>
  );
}
