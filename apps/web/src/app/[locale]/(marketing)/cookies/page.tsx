import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default async function CookiesPage() {
  return (
    <Section className="py-12 sm:py-20">
      <Container className="max-w-4xl space-y-8">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>NOTICE: TEMPLATE DRAFT FOR PLATFORM REVIEW — MUST BE FORMALLY REVIEWED WITH A LAWYER BEFORE PRODUCTION GO-LIVE.</span>
        </div>

        <header className="space-y-2 border-b border-border pb-6">
          <Badge variant="default">Cookie Policy</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Cookie Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: November 21, 2026</p>
        </header>

        <div className="space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
          <h2 className="text-lg font-bold text-foreground">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device by websites you visit to store session preferences,
            maintain authentication state, and optimize performance.
          </p>

          <h2 className="text-lg font-bold text-foreground">2. Essential Cookies We Use</h2>
          <p>
            We use strictly necessary httpOnly, SameSite cookies (<code className="bg-secondary px-1 py-0.5 rounded">orbitly_access_token</code> and <code className="bg-secondary px-1 py-0.5 rounded">orbitly_refresh_token</code>)
            to authenticate your sessions and protect against cross-site request forgery (CSRF).
          </p>

          <h2 className="text-lg font-bold text-foreground">3. Analytics & Preference Cookies</h2>
          <p>
            We use local storage keys (<code className="bg-secondary px-1 py-0.5 rounded">orbitly_cookie_consent</code> and <code className="bg-secondary px-1 py-0.5 rounded">theme</code>)
            to remember your dark/light preference and cookie choices without tracking your identity across unrelated websites.
          </p>
        </div>
      </Container>
    </Section>
  );
}
