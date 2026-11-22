import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { Globe, Shield, Sparkles, Heart } from 'lucide-react';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Our Story & Mission</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Building the Universal Publishing Layer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Orbitly was conceived to liberate creators, freelancers, and businesses from fragmented social tools
            and tedious multi-tab manual posting.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="max-w-4xl space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Plan Once. Publish Everywhere.</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                As social media diversified across decentralized networks (Bluesky, Mastodon), professional channels
                (LinkedIn), short-form video (TikTok, YouTube Shorts), and community chat (Discord, Telegram), the
                overhead of maintaining a consistent brand presence exploded.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We set out to create a unified operating system that respects the native culture of each network
                while providing one synchronized master calendar and publishing engine.
              </p>
            </div>
            <div className="p-8 rounded-3xl border border-border bg-card/60 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
              <OrbitlyLogo size={48} />
              <h3 className="font-extrabold text-lg">Orbitly Principles</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                1. Respect platform individuality • 2. Safe & encrypted by default • 3. Accessible worldwide in every tongue.
              </p>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-3xl border border-border bg-card/50 space-y-2">
              <Globe className="w-6 h-6 text-indigo-500 mb-2" />
              <h3 className="text-sm font-bold">Global from Day One</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built with full internationalization across 7 languages, native Arabic RTL support, and multi-currency billing.
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border border-border bg-card/50 space-y-2">
              <Shield className="w-6 h-6 text-emerald-500 mb-2" />
              <h3 className="text-sm font-bold">Uncompromising Security</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AES-256-GCM token encryption, rate-limiting, two-factor authentication, and strict RBAC controls protect your channels.
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border border-border bg-card/50 space-y-2">
              <Sparkles className="w-6 h-6 text-cyan-500 mb-2" />
              <h3 className="text-sm font-bold">Human-Centric AI</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our AI assists your voice rather than replacing it—adapting tone, structuring threads, and extracting hashtags cleanly.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="pt-0 pb-20">
        <Container>
          <CtaBanner locale={locale} />
        </Container>
      </Section>
    </div>
  );
}
