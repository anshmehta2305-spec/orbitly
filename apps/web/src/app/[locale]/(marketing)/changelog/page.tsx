import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Shield, Layers } from 'lucide-react';

export default async function ChangelogPage() {
  const releases = [
    {
      version: 'v2.0.0',
      date: 'November 2026',
      badge: 'Major Release',
      title: 'Orbitly 2.0: Multi-Platform Publishing & Model Context Protocol (MCP)',
      highlights: [
        'Integrated official Orbitly MCP Server for autonomous AI agent scheduling',
        'Added Threads Graph API native publishing with thread sequencing',
        'New Client Sharing portal with white-label custom domain support',
        'Upgraded to Next.js 15 App Router with full RTL support for Arabic',
      ],
    },
    {
      version: 'v1.4.0',
      date: 'October 2026',
      badge: 'Feature Update',
      title: 'AI Tone Studio & First-Comment Automation',
      highlights: [
        'Multi-model AI Studio supporting Google Gemini, Claude, and OpenAI',
        'Added first-comment automation for Instagram, LinkedIn, and Reddit',
        'Interactive "Best Time to Post" audience engagement calculator',
      ],
    },
    {
      version: 'v1.0.0',
      date: 'September 2026',
      badge: 'Initial Launch',
      title: 'Orbitly Public Beta Release',
      highlights: [
        'Core social media calendar with drag-and-drop rescheduling',
        'Support for X, LinkedIn, Instagram, TikTok, and YouTube',
        'AES-256-GCM authenticated encryption for social OAuth tokens',
      ],
    },
  ];

  return (
    <div>
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Product Evolution</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Changelog & Updates
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            See what new capabilities, network adapters, and performance enhancements we ship every week.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="max-w-4xl space-y-8">
          {releases.map((rel) => (
            <Card key={rel.version} className="p-8 rounded-3xl border border-border bg-card/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{rel.version}</Badge>
                  <span className="text-xs font-bold text-primary">{rel.badge}</span>
                </div>
                <span className="text-xs text-muted-foreground">{rel.date}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-4">{rel.title}</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {rel.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span className="text-foreground/90">{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </Container>
      </Section>
    </div>
  );
}
