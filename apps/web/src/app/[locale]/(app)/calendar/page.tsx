'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/app/AppShell';
import { CalendarView, CalendarPostItem } from '@/components/calendar/CalendarView';
import type { ChannelOption } from '@/components/composer/ComposerModal';

const ComposerModal = dynamic(
  () => import('@/components/composer/ComposerModal').then((mod) => mod.ComposerModal),
  { ssr: false }
);

const CsvImportModal = dynamic(
  () => import('@/components/calendar/CsvImportModal').then((mod) => mod.CsvImportModal),
  { ssr: false }
);

export default function CalendarPage() {
  const workspaceId = 'ws_demo_1';

  // Sample channels reflecting Step 4
  const channels: ChannelOption[] = [
    {
      id: 'chan_bsky_1',
      provider: 'BLUESKY',
      accountName: 'sarah.bsky.social',
      color: '#0284c7',
      maxChars: 300,
      maxImages: 4,
      supportsThreads: true,
      supportsFirstComment: false,
      supportsPolls: false,
    },
    {
      id: 'chan_masto_1',
      provider: 'MASTODON',
      accountName: 'sarah@mastodon.social',
      color: '#6366f1',
      maxChars: 500,
      maxImages: 4,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: true,
    },
    {
      id: 'chan_tg_1',
      provider: 'TELEGRAM',
      accountName: '@orbitly_announcements',
      color: '#06b6d4',
      maxChars: 4096,
      maxImages: 1,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: false,
    },
    {
      id: 'chan_disc_1',
      provider: 'DISCORD',
      accountName: '#marketing-announcements',
      color: '#5865f2',
      maxChars: 2000,
      maxImages: 10,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: false,
    },
    {
      id: 'chan_tiktok_1',
      provider: 'TIKTOK',
      accountName: '@sarah_creatives',
      color: '#000000',
      maxChars: 2200,
      maxImages: 0,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: false,
    },
    {
      id: 'chan_pin_1',
      provider: 'PINTEREST',
      accountName: 'Sarah Aesthetics',
      color: '#bd081c',
      maxChars: 500,
      maxImages: 1,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: false,
    },
    {
      id: 'chan_reddit_1',
      provider: 'REDDIT',
      accountName: 'u/sarah_design',
      color: '#ff4500',
      maxChars: 40000,
      maxImages: 1,
      supportsThreads: false,
      supportsFirstComment: false,
      supportsPolls: false,
    },
  ];

  // Initial demo posts
  const today = new Date();
  const formatIsoDate = (offsetDays: number, hour: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    d.setUTCHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const [posts, setPosts] = useState<CalendarPostItem[]>([
    {
      id: 'post_1',
      title: 'Orbitly v2.0 Global Launch',
      content: '🪐 Thrilled to announce the global rollout of Orbitly! Plan once. Publish everywhere.',
      status: 'PUBLISHED',
      scheduledAt: formatIsoDate(-1, 14),
      timezone: 'UTC',
      channel: channels[0],
      tags: ['launch', 'saas'],
    },
    {
      id: 'post_2',
      title: 'Federated Publishing Tips',
      content: 'Why Mastodon and the Fediverse are essential for independent creators in 2026. #fediverse #indieweb',
      status: 'SCHEDULED',
      scheduledAt: formatIsoDate(1, 10),
      timezone: 'UTC',
      channel: channels[1],
      tags: ['fediverse'],
    },
    {
      id: 'post_3',
      title: 'Telegram Product Release Note',
      content: '📢 New Release: Cross-platform composer, smart timezone math, and automated recurring queues are live.',
      status: 'SCHEDULED',
      scheduledAt: formatIsoDate(2, 16),
      timezone: 'UTC',
      channel: channels[2],
      tags: ['product'],
    },
    {
      id: 'post_4',
      title: 'Discord Community Announcement',
      content: 'Server update: Join our live AMA session this Thursday at 4 PM UTC with the core team! 🚀',
      status: 'SCHEDULED',
      scheduledAt: formatIsoDate(3, 11),
      timezone: 'UTC',
      channel: channels[3],
      tags: ['community'],
    },
  ]);

  // Modals state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDatePrefill, setComposerDatePrefill] = useState<string | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const handleOpenComposer = (post?: CalendarPostItem, datePrefill?: string) => {
    setComposerDatePrefill(datePrefill || null);
    setComposerOpen(true);
  };

  const handlePostCreated = (newPost: any) => {
    const channelObj = channels[0];
    const item: CalendarPostItem = {
      id: newPost.id,
      title: newPost.title,
      content: newPost.variants?.[0]?.content || newPost.title,
      status: newPost.status || 'SCHEDULED',
      scheduledAt: newPost.scheduledAt || new Date().toISOString(),
      timezone: 'UTC',
      channel: channelObj,
      tags: [],
    };
    setPosts((prev) => [item, ...prev]);
  };

  return (
    <AppShell activeNav="calendar">
      <CalendarView
        initialPosts={posts}
        workspaceId={workspaceId}
        onOpenComposer={handleOpenComposer}
        onOpenCsvImport={() => setCsvModalOpen(true)}
      />

      <ComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPostCreated={handlePostCreated}
        initialScheduledAt={composerDatePrefill}
        channels={channels}
        workspaceId={workspaceId}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        workspaceId={workspaceId}
        onImportComplete={() => {
          // Re-fetch or add sample posts
        }}
      />
    </AppShell>
  );
}
