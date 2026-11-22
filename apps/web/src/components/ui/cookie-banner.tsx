'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { ShieldCheck, Cookie } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner({ locale }: { locale: string }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('orbitly_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('orbitly_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('orbitly_cookie_consent', 'essential_only');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-card/95 backdrop-blur-xl border border-border p-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>We value your privacy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Orbitly uses essential cookies for secure authentication and optional privacy-friendly analytics to
            improve our platform.{' '}
            <Link href={`/${locale}/cookies`} className="text-primary hover:underline font-medium">
              Read our Cookie Policy
            </Link>
            .
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="gradient" size="sm" onClick={handleAccept} className="text-xs h-8 px-4">
              Accept All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDecline} className="text-xs h-8 px-3">
              Essential Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
