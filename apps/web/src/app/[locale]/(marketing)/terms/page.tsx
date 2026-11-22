import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default async function TermsPage() {
  return (
    <Section className="py-12 sm:py-20">
      <Container className="max-w-4xl space-y-8">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>NOTICE: TEMPLATE DRAFT FOR PLATFORM REVIEW — MUST BE FORMALLY REVIEWED WITH A LAWYER BEFORE PRODUCTION GO-LIVE.</span>
        </div>

        <header className="space-y-2 border-b border-border pb-6">
          <Badge variant="default">Terms of Use</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: November 21, 2026</p>
        </header>

        <div className="space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
          <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By creating an account or accessing the Orbitly platform, you agree to comply with and be bound by these Terms
            of Service and all applicable laws and regulations governing third-party social APIs.
          </p>

          <h2 className="text-lg font-bold text-foreground">2. Social Media Platform Compliance</h2>
          <p>
            You agree to comply with the Developer Terms of Service of each social network connected to your Orbitly workspace,
            including X Developer Agreement, Meta Platform Terms, LinkedIn API Terms of Use, and TikTok Developer Terms.
            Spamming, automated harassment, or distributing malicious payloads is strictly prohibited and results in immediate account termination.
          </p>

          <h2 className="text-lg font-bold text-foreground">3. Subscriptions & Billing</h2>
          <p>
            Subscriptions are billed in advance on a recurring monthly or annual basis. You may cancel at any time through your
            workspace billing dashboard. All fees paid are non-refundable except where required by local consumer legislation.
          </p>

          <h2 className="text-lg font-bold text-foreground">4. Limitation of Liability</h2>
          <p>
            Orbitly provides its services on an "as is" and "as available" basis. While we maintain a 99.9% uptime track record,
            we are not liable for delayed publications caused by upstream third-party platform API outages, revoked user tokens, or network rate limits.
          </p>
        </div>
      </Container>
    </Section>
  );
}
