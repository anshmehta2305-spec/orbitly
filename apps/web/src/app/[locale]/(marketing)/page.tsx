'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProductMockup } from '@/components/marketing/ProductMockup';
import { PlatformLogosMarquee } from '@/components/marketing/PlatformLogosMarquee';
import { PricingCard, PricingPlan } from '@/components/marketing/PricingCard';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { TestimonialCard } from '@/components/marketing/TestimonialCard';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import {
  Calendar,
  PenSquare,
  Sparkles,
  Users,
  BarChart3,
  Layers,
  ArrowRight,
  Play,
  Zap,
  Globe,
  Clock,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [isAnnual, setIsAnnual] = useState(true);

  const samplePlans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Ideal for solo creators testing cross-channel publishing.',
      priceMonthly: 0,
      priceYearly: 0,
      features: ['3 social channels', '30 posts per month', '1 workspace member', '20 AI studio credits', '30-day analytics'],
      ctaText: 'Get Started Free',
      ctaVariant: 'outline',
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Built for active creators and freelancers scaling their reach.',
      priceMonthly: 24,
      priceYearly: 19,
      popular: true,
      features: [
        '10 social channels',
        '300 posts per month',
        '3 team members',
        '200 AI studio credits',
        '6-month analytics history',
        'Best time to post AI engine',
      ],
      ctaText: 'Start 14-Day Free Trial',
      ctaVariant: 'gradient',
    },
    {
      id: 'team',
      name: 'Team',
      tagline: 'Empower marketing teams with multi-stage approvals.',
      priceMonthly: 69,
      priceYearly: 55,
      features: [
        '25 social channels',
        '1,000 posts per month',
        '10 team members',
        '1,000 AI credits',
        'Multi-stage approval workflow',
        'Public client approval links',
        'White-label calendar branding',
      ],
      ctaText: 'Try Team Free',
      ctaVariant: 'outline',
    },
    {
      id: 'agency',
      name: 'Agency',
      tagline: 'Maximum power for global agencies handling unlimited brands.',
      priceMonthly: 199,
      priceYearly: 159,
      features: [
        '100 social channels',
        '10,000 posts per month',
        '50 team members',
        '5,000 AI credits',
        'Custom domain client portal',
        'Dedicated account manager',
        'Public API & MCP AI Server',
      ],
      ctaText: 'Contact Agency Sales',
      ctaVariant: 'outline',
    },
  ];

  const faqItems = [
    {
      q: 'How does Orbitly differ from standard single-network scheduling apps?',
      a: 'Orbitly gives you a single unified command center where you compose once, tailor per network with real-time character limit previews, and schedule using UTC timestamps with local timezone display. There is no switching between tabs or apps.',
    },
    {
      q: 'Which social networks does Orbitly currently support?',
      a: 'We support X (Twitter), LinkedIn, Instagram, Facebook Pages, Threads, TikTok, YouTube, Pinterest, Reddit, Bluesky, Mastodon, Telegram, Discord, Slack, and Medium, with our provider-plugin architecture continuously adding more.',
    },
    {
      q: 'Can my clients view and approve calendar drafts without signing up?',
      a: 'Yes! On Team and Agency tiers, you can generate secure, password-optional public preview links for clients to review, comment on, and approve scheduled posts. On Agency plans, you can even host this portal on your own custom domain.',
    },
    {
      q: 'How does the AI assistant help with cross-platform tone?',
      a: 'Orbitly AI understands platform vernacular. You can write a concise technical thought, and the AI will automatically repurpose it into an engaging LinkedIn hook with formatting, a concise X tweet with hashtags, and an Instagram visual caption with first-comment tags.',
    },
    {
      q: 'Are my social media OAuth tokens stored securely?',
      a: 'Absolutely. Every refresh token and access token is encrypted at rest using AES-256-GCM authenticated encryption with a unique initialization vector. Tokens are never exposed to client-side code.',
    },
    {
      q: 'Is there a free plan available?',
      a: 'Yes. Orbitly has a permanent Free tier allowing you to connect up to 3 channels and schedule 30 posts per month without requiring any credit card.',
    },
    {
      q: 'Does Orbitly support international languages and right-to-left (RTL) reading?',
      a: 'Yes. Orbitly is localized from day one into English, Hindi, Spanish, French, German, Portuguese, and Arabic with comprehensive native RTL layout alignment.',
    },
    {
      q: 'Can AI agents schedule posts via MCP (Model Context Protocol)?',
      a: 'Yes. Orbitly ships with an official MCP server letting autonomous agents (like Claude or Gemini) plan, draft, and inspect your publishing calendar via standard MCP tools.',
    },
  ];

  return (
    <div>
      {/* 1. HERO SECTION */}
      <Section className="pt-12 sm:pt-20 pb-16 relative">
        <Container className="text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Orbitly 2.0 is Live • Cross-Platform Social Publishing</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-foreground">
            Plan once.{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Publish everywhere.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One unified calendar to draft, tailor, schedule, and analyze content across 15+ social platforms.
            Built for creators, agencies, and high-velocity marketing teams.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/${locale}/signup`}>
              <Button variant="gradient" size="lg" className="text-sm font-bold shadow-xl shadow-indigo-500/25">
                <span>Start Free Account</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={`/${locale}/features`}>
              <Button variant="outline" size="lg" className="text-sm font-semibold gap-2">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Explore Interactive Features</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free forever tier
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1-click channel setup
            </span>
          </div>

          {/* Interactive Code-Rendered Product Mockup */}
          <div className="pt-10">
            <ProductMockup />
          </div>
        </Container>
      </Section>

      {/* 2. PLATFORM LOGOS MARQUEE */}
      <PlatformLogosMarquee />

      {/* 3. HOW IT WORKS IN 3 STEPS */}
      <Section className="bg-secondary/20">
        <Container>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <Badge variant="pulse">Simple 3-Step Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How Orbitly Works</h2>
            <p className="text-sm text-muted-foreground">
              From ideation to cross-network publishing in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Connect Your Networks',
                desc: 'Authorize X, LinkedIn, Instagram, TikTok, Threads, and 10+ more in seconds with encrypted OAuth.',
                icon: Globe,
              },
              {
                step: '02',
                title: 'Draft Once & Tailor Tone',
                desc: 'Write your core idea once. Use the AI Assistant to adjust tone, hashtags, and media aspect ratios per platform.',
                icon: PenSquare,
              },
              {
                step: '03',
                title: 'Automate & Analyze',
                desc: 'Queue content for optimal time slots or drag-and-drop on the calendar. Monitor real-time engagement in unified charts.',
                icon: Zap,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="p-8 rounded-3xl border border-border bg-card/60 relative overflow-hidden group hover:border-primary/50 transition-all"
                >
                  <span className="text-5xl font-black text-muted/30 absolute right-4 top-4 select-none">
                    {s.step}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* 4. ALTERNATING FEATURE HIGHLIGHTS */}
      <Section>
        <Container className="space-y-24">
          {/* Feature 1: Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Badge variant="default">Unified Social Calendar</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                One master calendar for all your publishing channels
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Color-coded channels, monthly/weekly views, drag-and-drop rescheduling, and timezone-aware
                rendering. Never lose track of an upcoming campaign again.
              </p>
              <ul className="space-y-2.5 text-xs text-foreground pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Drag-and-drop rescheduling across dates and slots
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Timezone intelligence: stored in UTC, rendered in local time
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  AI "Best Time to Post" recommendation engine
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl border border-border bg-card/50 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-2 border-b border-border">
                  <span>Weekly Queue Schedule</span>
                  <span className="text-primary">14 Posts Ready</span>
                </div>
                {['Monday 14:00 UTC • X (Twitter)', 'Tuesday 16:30 UTC • LinkedIn & Threads', 'Thursday 18:00 UTC • Instagram Reel'].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item}</span>
                    <Badge variant="success" className="text-[10px]">Approved</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2: Multi-Platform Composer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="space-y-4 lg:order-2">
              <Badge variant="pulse">Multi-Platform Composer</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Craft a global draft. Customize per platform.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Say goodbye to copy-pasting into 5 different tabs. Draft your core update once, preview
                character counts and media requirements for each network, and add first-comments with one click.
              </p>
              <ul className="space-y-2.5 text-xs text-foreground pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Real-time character countdowns per network
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  First-comment automation for Instagram, LinkedIn, and Reddit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Thread & carousel builders for X and Bluesky
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl border border-border bg-card/50 shadow-xl lg:order-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-foreground">Live Network Customizer</span>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                  <p className="font-semibold text-primary">Customized for LinkedIn:</p>
                  <p className="text-muted-foreground">
                    "Excited to share our breakthrough quarter! Here are 3 tactical lessons we learned while scaling
                    Orbitly to 10k users..."
                  </p>
                  <p className="text-[11px] text-emerald-500 font-medium">✓ First comment queued with resources</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 5. SAMPLE STATS STRIP */}
      <Section className="py-12 border-y border-border/80 bg-card/40">
        <Container>
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
              Platform Performance Metrics (Sample Benchmark)
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                350M+
              </p>
              <p className="text-xs text-muted-foreground mt-1">Posts Scheduled Annually</p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                99.98%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Publishing Queue Uptime</p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                15+
              </p>
              <p className="text-xs text-muted-foreground mt-1">Native Social Platforms</p>
            </div>
            <div>
              <p className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                140+
              </p>
              <p className="text-xs text-muted-foreground mt-1">Countries Worldwide</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* 6. USE CASES */}
      <Section>
        <Container>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <Badge variant="default">Tailored For Your Workflow</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built For Modern Operators</h2>
            <p className="text-sm text-muted-foreground">
              Whether you are an independent creator or a 50-person agency, Orbitly scales with you.
            </p>
          </div>

          <Tabs defaultValue="creators" className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="creators">Solo Creators</TabsTrigger>
                <TabsTrigger value="agencies">Agencies</TabsTrigger>
                <TabsTrigger value="startups">High-Growth Startups</TabsTrigger>
                <TabsTrigger value="teams">Marketing Teams</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="creators">
              <div className="p-8 rounded-3xl border border-border bg-card/60 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">Never break your publishing streak</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Plan your weekly content in one afternoon. Let Orbitly handle publishing to X, Instagram,
                    TikTok, and YouTube Shorts while you focus on creative work.
                  </p>
                  <Link href={`/${locale}/signup`}>
                    <Button variant="gradient" size="sm" className="mt-2 text-xs">
                      Start as Creator
                    </Button>
                  </Link>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs space-y-2">
                  <div className="font-bold text-foreground">Weekly Creator Queue:</div>
                  <div className="p-2 bg-card rounded-lg border border-border">5 Tweets queued for X</div>
                  <div className="p-2 bg-card rounded-lg border border-border">3 Carousels ready for LinkedIn</div>
                  <div className="p-2 bg-card rounded-lg border border-border">2 Reels scheduled for Instagram</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agencies">
              <div className="p-8 rounded-3xl border border-border bg-card/60 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">White-label portals for client approvals</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Create separate workspaces per client, invite stakeholders to review calendars with zero login
                    friction, and present your agency logo on custom domains.
                  </p>
                  <Link href={`/${locale}/signup`}>
                    <Button variant="gradient" size="sm" className="mt-2 text-xs">
                      Explore Agency Plan
                    </Button>
                  </Link>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs space-y-2">
                  <div className="font-bold text-foreground">Agency Client Portal:</div>
                  <div className="p-2 bg-card rounded-lg border border-border text-emerald-500 font-semibold">
                    ✓ 3 Client workspaces active
                  </div>
                  <div className="p-2 bg-card rounded-lg border border-border">Custom Domain: client.agency.com</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="startups">
              <div className="p-8 rounded-3xl border border-border bg-card/60 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">Accelerate organic growth across founders</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enable co-founders and early hires to contribute thought leadership with pre-publish review
                    safety, RSS-to-post automations, and viral thread formatting.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs">
                  <p className="font-mono text-primary">Founder personal branding + Company announcements</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teams">
              <div className="p-8 rounded-3xl border border-border bg-card/60 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">RBAC controls, audit trails, and approvals</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Role-based access controls ensure copywriters draft, editors refine, and marketing directors
                    give final sign-off with clear audit history.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-xs">
                  <p className="font-mono text-emerald-400">Owner • Admin • Editor • Viewer</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>

      {/* 7. TESTIMONIALS */}
      <Section className="bg-secondary/20">
        <Container>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <Badge variant="default">Community Feedback (Placeholder Benchmarks)</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Loved by Social Media Leaders</h2>
            <p className="text-sm text-muted-foreground">
              Here is what pilot marketing leads and creators say about Orbitly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Orbitly completely eradicated our multi-tab publishing nightmare. The per-network customization with live character limits saves our team 8 hours every week."
              author="Alex V. (Sample Reviewer)"
              role="Head of Content"
              company="Apex Media Agency"
              avatarInitial="A"
            />
            <TestimonialCard
              quote="The AI tone rewriter is genuinely impressive. It turns my technical blog summaries into punchy LinkedIn posts and visual Instagram captions automatically."
              author="Elena R. (Sample Reviewer)"
              role="Tech Founder & Creator"
              company="CloudScale AI"
              avatarInitial="E"
            />
            <TestimonialCard
              quote="Our clients love the read-only approval links. They review the full month of posts on their phone, comment on copy changes, and approve in minutes."
              author="Marcus T. (Sample Reviewer)"
              role="Operations Director"
              company="Velocity Brand Studio"
              avatarInitial="M"
            />
          </div>
        </Container>
      </Section>

      {/* 8. PRICING PREVIEW */}
      <Section id="pricing">
        <Container>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <Badge variant="pulse">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Simple, Predictable Plans</h2>
            <p className="text-sm text-muted-foreground">
              Start free today and upgrade as your social channels and team members expand.
            </p>

            {/* Toggle Monthly / Annual */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 rounded-full bg-secondary p-1 border border-border relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-primary transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual Billing <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {samplePlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                currency="USD"
                currencySymbol="$"
                locale={locale}
              />
            ))}
          </div>

          <div className="text-center pt-8">
            <Link
              href={`/${locale}/pricing`}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View full feature comparison matrix across all tiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* 9. FAQ SECTION (8 QUESTIONS) */}
      <Section className="bg-secondary/20">
        <Container className="max-w-4xl">
          <div className="text-center space-y-3 mb-12">
            <Badge variant="default">Got Questions?</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about the Orbitly social publishing suite.
            </p>
          </div>

          <Accordion className="space-y-2">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} title={item.q} defaultOpen={index === 0}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* 10. FINAL CTA BANNER */}
      <Section className="pt-8 pb-20">
        <Container>
          <CtaBanner locale={locale} />
        </Container>
      </Section>
    </div>
  );
}
