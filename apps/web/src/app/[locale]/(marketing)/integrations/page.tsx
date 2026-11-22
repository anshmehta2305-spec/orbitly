'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { Search, ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  category: 'social' | 'video' | 'messaging' | 'professional' | 'publishing';
  status: 'Live' | 'Coming Soon';
  description: string;
  features: string[];
}

export default function IntegrationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const platforms: Platform[] = [
    {
      name: 'X (formerly Twitter)',
      category: 'social',
      status: 'Live',
      description: 'Publish single tweets, multi-tweet threads, polls, and media directly via X API v2.',
      features: ['280 characters', 'Thread numbering', 'Images & Video', 'Metrics'],
    },
    {
      name: 'LinkedIn',
      category: 'professional',
      status: 'Live',
      description: 'Post to personal profiles and company pages with PDF carousels and first-comment links.',
      features: ['3,000 characters', 'PDF Carousels', 'First Comment', 'Company Pages'],
    },
    {
      name: 'Instagram',
      category: 'social',
      status: 'Live',
      description: 'Schedule feed photos, carousels, and Instagram Reels with auto-publishing.',
      features: ['2,200 characters', 'Reels', 'Carousels', 'Auto-Publish'],
    },
    {
      name: 'Facebook Pages',
      category: 'social',
      status: 'Live',
      description: 'Publish updates, high-res photos, and videos to multiple Facebook business pages.',
      features: ['63,000 characters', 'Page Insights', 'Video Uploads'],
    },
    {
      name: 'Threads',
      category: 'social',
      status: 'Live',
      description: 'Schedule text updates, threads, and photos to Meta Threads via the official Graph API.',
      features: ['500 characters', 'Threads', 'Direct Publishing'],
    },
    {
      name: 'TikTok',
      category: 'video',
      status: 'Live',
      description: 'Schedule short-form videos with custom captions, cover frames, and privacy settings.',
      features: ['Short Video', 'Cover Frame Picker', 'Audience Controls'],
    },
    {
      name: 'YouTube',
      category: 'video',
      status: 'Live',
      description: 'Upload and schedule YouTube Shorts and full-length videos with tags, title, and thumbnails.',
      features: ['YouTube Shorts', 'Thumbnails', 'Title & Tags'],
    },
    {
      name: 'Pinterest',
      category: 'social',
      status: 'Live',
      description: 'Pin images and videos directly to chosen boards with custom destination URLs.',
      features: ['Board Selector', 'Link Pins', 'High-res Visuals'],
    },
    {
      name: 'Bluesky',
      category: 'social',
      status: 'Live',
      description: 'Publish to the decentralized AT Protocol network with full thread and alt-text support.',
      features: ['300 characters', 'AT Protocol', 'Threads & Mentions'],
    },
    {
      name: 'Mastodon',
      category: 'social',
      status: 'Live',
      description: 'Connect to any Mastodon Fediverse server instance with custom instance domain tokens.',
      features: ['500 characters', 'Custom Instances', 'Content Warnings'],
    },
    {
      name: 'Reddit',
      category: 'social',
      status: 'Live',
      description: 'Submit posts to subscribed subreddits with flair selection and first-comment triggers.',
      features: ['Subreddit Flairs', 'Markdown', 'Karma Safety Delay'],
    },
    {
      name: 'Telegram',
      category: 'messaging',
      status: 'Live',
      description: 'Broadcast rich formatted announcements and media directly to Telegram channels and groups.',
      features: ['Bot API', 'Silent Mode', 'MarkdownV2'],
    },
    {
      name: 'Discord',
      category: 'messaging',
      status: 'Live',
      description: 'Send custom announcement embeds with buttons and webhooks into Discord community channels.',
      features: ['Rich Embeds', 'Webhooks', 'Role Mentions'],
    },
    {
      name: 'Slack',
      category: 'messaging',
      status: 'Live',
      description: 'Deliver scheduled internal updates and executive briefings to team Slack channels.',
      features: ['Block Kit', 'Private Channels', 'Scheduled Drops'],
    },
    {
      name: 'Medium',
      category: 'publishing',
      status: 'Live',
      description: 'Cross-post long-form articles with canonical link protection for search SEO.',
      features: ['Canonical URLs', 'Markdown', 'Story Tags'],
    },
    {
      name: 'Snapchat Spotlight',
      category: 'video',
      status: 'Coming Soon',
      description: 'Scheduled spotlight video uploads and audience engagement analytics.',
      features: ['Short Video', 'Spotlight API'],
    },
  ];

  const filtered = platforms.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Header */}
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Provider Ecosystem</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Connect Everywhere You Publish
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Orbitly features a modular provider-plugin architecture. Authorize your accounts once and schedule
            seamlessly across all major networks.
          </p>

          {/* Search + Category Tabs */}
          <div className="pt-6 max-w-md mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search platforms by name (e.g. X, LinkedIn, YouTube)..."
                className="pl-10 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All (16)' },
                { id: 'social', label: 'Social' },
                { id: 'video', label: 'Video & Reels' },
                { id: 'professional', label: 'Professional' },
                { id: 'messaging', label: 'Community' },
                { id: 'publishing', label: 'Long-form' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Grid */}
      <Section className="pt-0">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Card
                key={p.name}
                className="p-6 rounded-3xl border border-border bg-card/60 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                    <Badge variant={p.status === 'Live' ? 'success' : 'secondary'} className="text-[10px]">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-border flex flex-wrap gap-1.5">
                  {p.features.map((f, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-0 pb-20">
        <Container>
          <CtaBanner locale={locale} />
        </Container>
      </Section>
    </div>
  );
}
