'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { CheckCircle2, ShieldCheck, Mail, BellOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('user@example.com');
  const [lifecycle, setLifecycle] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [unsubscribedAll, setUnsubscribedAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (token) {
      // In live environment, fetch current preferences from /email/preferences?token=...
      setEmail('creator@company.com');
    }
  }, [token]);

  const handleSavePreferences = () => {
    setIsSaved(true);
    toast.success('Your communication preferences have been updated.');
  };

  const handleUnsubscribeAll = () => {
    setLifecycle(false);
    setMarketing(false);
    setWeeklyDigest(false);
    setUnsubscribedAll(true);
    setIsSaved(true);
    toast.success('You have been unsubscribed from all optional email communications.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <header className="h-16 border-b border-border px-6 flex items-center justify-between">
        <OrbitlyLogo size={30} />
        <Badge variant="outline" className="text-xs font-mono">
          Email Preference Center
        </Badge>
      </header>

      <main className="flex-1 py-12 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Communication Preferences</h1>
            <p className="text-xs text-muted-foreground">
              Manage the types of email messages you receive for <strong className="text-foreground">{email}</strong>.
            </p>
          </div>

          {unsubscribedAll ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-emerald-400">
                You have been unsubscribed from all optional communications.
              </p>
              <p className="text-[11px] text-muted-foreground">
                You will only receive critical transactional emails (password resets, security notices, and invoices).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category 1: Lifecycle & Tips */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl border border-border bg-secondary/20">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-xs font-bold text-foreground block">
                    Product Lifecycle & Onboarding Nudges
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-relaxed">
                    Helpful tips, channel setup recommendations, and trial status reminders.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={lifecycle}
                  onChange={(e) => setLifecycle(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded mt-1"
                />
              </div>

              {/* Category 2: Weekly Performance Digest */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl border border-border bg-secondary/20">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-xs font-bold text-foreground block">
                    Weekly Performance Digest
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-relaxed">
                    Weekly overview of published posts, impressions, and peak engagement times.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded mt-1"
                />
              </div>

              {/* Category 3: Marketing & Features */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl border border-border bg-secondary/20">
                <div className="space-y-0.5 max-w-sm">
                  <span className="text-xs font-bold text-foreground block">
                    Product Updates & Feature Announcements
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-relaxed">
                    Major release announcements, new social platform integrations, and webinars.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSavePreferences}
                  className="w-full sm:flex-1 font-bold"
                >
                  Save Preferences
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsubscribeAll}
                  className="w-full sm:w-auto text-xs hover:border-rose-500 hover:text-rose-500 font-semibold"
                >
                  Unsubscribe from All
                </Button>
              </div>
            </div>
          )}

          {/* Legal Compliance Footer */}
          <div className="pt-4 border-t border-border text-center text-[10px] text-muted-foreground space-y-1">
            <p>Orbitly Inc. &bull; 100 Innovation Way, Suite 400 &bull; San Francisco, CA</p>
            <p>Compliance: GDPR Article 7(3) & CAN-SPAM Act 15 U.S.C. 7704</p>
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-border px-6 flex items-center justify-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Orbitly Inc. All rights reserved.
      </footer>
    </div>
  );
}
