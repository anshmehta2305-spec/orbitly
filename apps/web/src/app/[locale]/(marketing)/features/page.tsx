import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import {
  Calendar,
  PenSquare,
  Sparkles,
  Users,
  BarChart3,
  Layers,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Share2,
  Workflow,
  Radio,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const featureDeepDives = [
    {
      id: 'calendar',
      badge: 'Visual Command Center',
      title: 'Interactive Social Publishing Calendar',
      icon: Calendar,
      desc: 'Plan, schedule, and reorganize your campaigns with intuitive drag-and-drop mechanics. Stored safely in UTC, rendered in the user timezone.',
      bullets: [
        'Day, week, and month views with color-coded channels',
        'Recurring publishing slots per channel and day-of-week',
        'AI-driven "Best Time to Post" recommendations based on audience engagement',
        'Bulk scheduling via CSV uploads for high-volume creators',
      ],
    },
    {
      id: 'composer',
      badge: 'Unified Drafting',
      title: 'Multi-Platform Social Composer',
      icon: PenSquare,
      desc: 'Write one global master draft, then fine-tune text, media aspect ratios, and formatting for each specific social platform.',
      bullets: [
        'Live simulated previews for X, LinkedIn, Instagram, TikTok, and Threads',
        'Real-time character countdowns and media format validation',
        'Automated first-comment support for hashtag strategies',
        'Thread builder for X and Bluesky with numbering and reply delay',
      ],
    },
    {
      id: 'ai',
      badge: 'Provider-Agnostic AI',
      title: 'AI Tone Studio & Repurposing Engine',
      icon: Sparkles,
      desc: 'Connect OpenAI, Anthropic, or Google Gemini through your own keys to effortlessly rewrite content for each network culture.',
      bullets: [
        'Article to multi-platform post: paste a blog URL and generate a ready thread',
        'Tone shifter: casual, professional, provocative, concise, or inspiring',
        'AI hashtag generator based on viral trend semantics',
        'Smart image captioning and alt-text generator for accessibility',
      ],
    },
    {
      id: 'team',
      badge: 'Collaboration & Safety',
      title: 'Workspaces & Multi-Stage Approvals',
      icon: Users,
      desc: 'Organize work into separate multi-tenant workspaces. Assign roles (Owner, Admin, Editor, Viewer) to prevent accidental publications.',
      bullets: [
        'Approval states: Draft -> In Review -> Approved -> Scheduled',
        'In-line editorial comments on drafts for seamless feedback',
        'Immutable audit logs for compliance and security',
        'Instant team email notifications and in-app alerts',
      ],
    },
    {
      id: 'analytics',
      badge: 'Unified Intelligence',
      title: 'Cross-Network Analytics & Reporting',
      icon: BarChart3,
      desc: 'Track cross-network performance from a single consolidated dashboard. Compare engagement rates, impressions, and audience growth.',
      bullets: [
        'Per-channel and per-post metric drill-downs',
        'Custom date-range comparisons with interactive SVG charts',
        'Automated weekly PDF and CSV summary export for clients',
        'Engagement benchmarks across post formats (text vs carousel vs video)',
      ],
    },
    {
      id: 'client-sharing',
      badge: 'Agency Power',
      title: 'Public Client Sharing & White-Labeling',
      icon: Layers,
      desc: 'Give clients instant visibility without forcing them to create an account. Protect with optional passwords or embed on custom agency domains.',
      bullets: [
        'Read-only client calendar preview links with one click',
        'Client comment and approval sign-off buttons right on the preview page',
        'Custom logo, favicon, and brand color injection',
        'Custom domain support (e.g. social.youragency.com) on Agency tier',
      ],
    },
    {
      id: 'automations',
      badge: 'Evergreen Growth',
      title: 'Automations & Evergreen Content Recycling',
      icon: Workflow,
      desc: 'Keep your social feeds consistently active with RSS feeds and automated recycling of top-performing content.',
      bullets: [
        'RSS-to-Post: Automatically queue new articles from your blog or newsletter',
        'Evergreen Recycling: Re-queue best-performing evergreen posts on designated intervals',
        'Outbound webhook triggers on post events (published, failed, commented)',
        'Built-in rate-limiting and duplicate protection',
      ],
    },
  ];

  return (
    <div>
      {/* Header */}
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Features Overview</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            The Complete Social Media Operating System
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need to plan, draft, collaborate, schedule, and analyze content across all major
            networks from one high-performance command center.
          </p>
        </Container>
      </Section>

      {/* Feature Sections */}
      <Section>
        <Container className="space-y-24">
          {featureDeepDives.map((feat, index) => {
            const Icon = feat.icon;
            const isReversed = index % 2 === 1;

            return (
              <div
                key={feat.id}
                id={feat.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={`space-y-4 ${isReversed ? 'lg:order-2' : ''}`}>
                  <Badge variant="default">{feat.badge}</Badge>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    {feat.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>

                  <ul className="space-y-2.5 text-xs text-foreground pt-2">
                    {feat.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3">
                    <Link href={`/${locale}/signup`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                        <span>Try this feature free</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className={`p-8 rounded-3xl border border-border bg-card/60 shadow-xl ${isReversed ? 'lg:order-1' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Designed for zero-friction execution</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    Native API integrations ensure full compatibility with each network's newest feature releases,
                    from Threads formatting to Instagram Reels and LinkedIn carousel PDFs.
                  </p>
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs font-mono text-muted-foreground">
                    Status: <span className="text-emerald-500 font-bold">● Active & Monitored</span>
                  </div>
                </div>
              </div>
            );
          })}
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-8 pb-20">
        <Container>
          <CtaBanner locale={locale} />
        </Container>
      </Section>
    </div>
  );
}
