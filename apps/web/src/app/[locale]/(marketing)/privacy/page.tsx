import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default async function PrivacyPage() {
  return (
    <Section className="py-12 sm:py-20">
      <Container className="max-w-4xl space-y-8">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>NOTICE: TEMPLATE DRAFT FOR PLATFORM REVIEW — MUST BE FORMALLY REVIEWED WITH A LAWYER BEFORE PRODUCTION GO-LIVE.</span>
        </div>

        <header className="space-y-2 border-b border-border pb-6">
          <Badge variant="default">Legal Compliance</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: November 21, 2026</p>
        </header>

        <div className="space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
          <h2 className="text-lg font-bold text-foreground">1. Introduction</h2>
          <p>
            Orbitly SaaS Inc. ("Orbitly", "we", "us", or "our") respects your privacy and is committed to protecting
            the personal data you share when using our web application, social publishing engine, and public APIs.
          </p>

          <h2 className="text-lg font-bold text-foreground">2. Data We Collect</h2>
          <p>
            We collect information provided directly by you during account creation (name, work email, password hash),
            social network authentication tokens (access and refresh tokens encrypted via AES-256-GCM), workspace metadata,
            and content you draft for social publication.
          </p>

          <h2 className="text-lg font-bold text-foreground">3. How We Use Your Data</h2>
          <p>
            Your data is used solely to provide social publishing services, process BullMQ queue delays, compute cross-channel
            analytics, and fulfill user requests. We do not sell, rent, or monetize your personal or content data to third parties.
          </p>

          <h2 className="text-lg font-bold text-foreground">4. Social Media Tokens & Security</h2>
          <p>
            OAuth credentials granting publishing rights to X, LinkedIn, Instagram, Meta, TikTok, and other platforms are
            encrypted at rest using military-grade authenticated cryptography. Tokens are only decrypted within isolated worker
            processes at the exact time of scheduled publication.
          </p>

          <h2 className="text-lg font-bold text-foreground">5. GDPR & User Rights</h2>
          <p>
            In compliance with the General Data Protection Regulation (GDPR) and global privacy mandates, you have the right to
            export all data associated with your workspace or request permanent deletion of your account and tokens at any time.
          </p>
        </div>
      </Container>
    </Section>
  );
}
