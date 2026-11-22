'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function OrbitlyLogo({ className = '', size = 32, showWordmark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Original SVG Emblem: Concentric planetoid trajectories around a central publishing node */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Orbit Path */}
        <ellipse
          cx="24"
          cy="24"
          rx="21"
          ry="9"
          transform="rotate(-28 24 24)"
          stroke="url(#orbitGrad1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 3"
          className="opacity-70"
        />

        {/* Intersecting Dynamic Arc */}
        <path
          d="M7 28 C 12 12, 36 8, 41 20 C 43 25, 39 36, 26 40"
          stroke="url(#orbitGrad2)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Central Publishing Node */}
        <circle cx="24" cy="24" r="6" fill="url(#orbitGrad1)" filter="url(#glow)" />
        <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />

        {/* Orbiting Satellite Node */}
        <circle cx="39" cy="18" r="3.2" fill="#06B6D4" filter="url(#glow)" />
        <circle cx="9" cy="30" r="2.2" fill="#F43F5E" />
      </svg>

      {showWordmark && (
        <span className="font-extrabold tracking-tight text-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Orbitly
        </span>
      )}
    </div>
  );
}
