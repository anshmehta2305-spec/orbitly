import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookOpen, Terminal, Key, Webhook, Bot, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const docSections = [
    {
      title: 'Getting Started Guide',
      desc: 'Set up your first personal or team workspace, connect social accounts, and schedule your debut multi-channel post.',
      icon: BookOpen,
      href: `/${locale}/docs/getting-started`,
    },
    {
      title: 'Public REST API Reference',
      desc: 'Explore API endpoints for programmatic post creation, queue management, media ingestion, and analytics.',
      icon: Terminal,
      href: `/${locale}/docs/api`,
    },
    {
      title: 'Model Context Protocol (MCP) Server',
      desc: 'Connect autonomous coding and conversational AI agents directly to Orbitly to schedule posts automatically.',
      icon: Bot,
      href: `/${locale}/docs/mcp`,
    },
    {
      title: 'Webhooks & Event Triggers',
      desc: 'Receive real-time HTTPS webhooks for post published, scheduled, failed, and client approval events.',
      icon: Webhook,
      href: `/${locale}/docs/webhooks`,
    },
    {
      title: 'Custom Provider Plugin Guide',
      desc: 'Learn how to implement the ISocialProvider interface to add custom proprietary publishing channels in one file.',
      icon: FileText,
      href: `/${locale}/docs/providers`,
    },
    {
      title: 'API Authentication & Rate Limits',
      desc: 'Scoped API tokens, header conventions, rate limiting windows, and exponential backoff retry guidelines.',
      icon: Key,
      href: `/${locale}/docs/auth`,
    },
  ];

  return (
    <div>
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Developer & User Hub</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Orbitly Documentation
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Everything you need to master Orbitly, automate campaigns via our REST API, or integrate with AI agents.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docSections.map((sec) => {
              const Icon = sec.icon;
              return (
                <Card
                  key={sec.title}
                  className="p-6 rounded-3xl border border-border bg-card/60 hover:border-primary/50 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sec.desc}</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>
    </div>
  );
}
