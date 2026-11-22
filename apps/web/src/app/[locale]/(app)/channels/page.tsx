'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Share2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Info,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

interface ChannelItem {
  id: string;
  provider: string; // 'BLUESKY' | 'MASTODON' | 'TELEGRAM' | 'DISCORD'
  accountName: string;
  avatarUrl?: string;
  status: 'CONNECTED' | 'NEEDS_REAUTH' | 'EXPIRED' | 'DISABLED' | 'ERROR';
  color: string;
  timezone: string;
  defaultHashtags: string[];
  signature?: string;
  lastCheckedAt: string;
  postCount: number;
}

export default function ChannelsPage() {
  const t = useTranslations('Channels');

  // Initial mock channels reflecting the seed data
  const [channels, setChannels] = useState<ChannelItem[]>([
    {
      id: 'chan_bsky_1',
      provider: 'BLUESKY',
      accountName: 'sarah.bsky.social',
      status: 'CONNECTED',
      color: '#0284c7', // Sky Blue
      timezone: 'UTC',
      defaultHashtags: ['#creators', '#orbitly'],
      signature: '✨ Sent via Orbitly',
      lastCheckedAt: '5 minutes ago',
      postCount: 14,
    },
    {
      id: 'chan_masto_1',
      provider: 'MASTODON',
      accountName: 'sarah@mastodon.social',
      status: 'CONNECTED',
      color: '#6366f1', // Indigo
      timezone: 'UTC',
      defaultHashtags: ['#fediverse', '#indieweb'],
      lastCheckedAt: '12 minutes ago',
      postCount: 9,
    },
    {
      id: 'chan_tg_1',
      provider: 'TELEGRAM',
      accountName: '@orbitly_announcements',
      status: 'CONNECTED',
      color: '#06b6d4', // Cyan
      timezone: 'America/New_York',
      defaultHashtags: [],
      signature: '📢 Broadcast via Orbitly',
      lastCheckedAt: '25 minutes ago',
      postCount: 32,
    },
    {
      id: 'chan_disc_1',
      provider: 'DISCORD',
      accountName: '#marketing-announcements',
      status: 'NEEDS_REAUTH',
      color: '#5865f2', // Blurple
      timezone: 'UTC',
      defaultHashtags: ['#orbitly'],
      lastCheckedAt: '1 hour ago',
      postCount: 21,
    },
  ]);

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  // Modals & Drawers state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProviderToConnect, setSelectedProviderToConnect] = useState<string | null>(null);
  const [connectTab, setConnectTab] = useState<'live' | 'all'>('live');
  const [providerSearch, setProviderSearch] = useState('');

  // Form states for direct connect
  const [connectLoading, setConnectLoading] = useState(false);
  const [bskyHandle, setBskyHandle] = useState('');
  const [bskyPassword, setBskyPassword] = useState('');
  const [mastoInstance, setMastoInstance] = useState('https://mastodon.social');
  const [mastoToken, setMastoToken] = useState('');
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordUsername, setDiscordUsername] = useState('Orbitly Bot');
  const [tiktokHandle, setTiktokHandle] = useState('@my_brand');
  const [pinterestAccount, setPinterestAccount] = useState('Brand Pins');
  const [redditUsername, setRedditUsername] = useState('brand_official');

  // Settings Drawer state
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);
  const [settingName, setSettingName] = useState('');
  const [settingColor, setSettingColor] = useState('#6366f1');
  const [settingTimezone, setSettingTimezone] = useState('UTC');
  const [settingHashtags, setSettingHashtags] = useState('');
  const [settingSignature, setSettingSignature] = useState('');
  const [settingEnabled, setSettingEnabled] = useState(true);

  // Disconnect Confirmation state
  const [disconnectingChannel, setDisconnectingChannel] = useState<ChannelItem | null>(null);

  // Validating loading tracker
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Supported providers list
  const allProviders = [
    {
      id: 'bluesky',
      name: 'Bluesky',
      enum: 'BLUESKY',
      status: 'live',
      tag: 'AT Protocol',
      desc: 'Connect with your Bluesky handle and App Password. Supports text, images, and threads.',
      color: '#0284c7',
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      enum: 'MASTODON',
      status: 'live',
      tag: 'Fediverse',
      desc: 'Publish to any federated Mastodon instance with text, images, and polls.',
      color: '#6366f1',
    },
    {
      id: 'telegram',
      name: 'Telegram Channel',
      enum: 'TELEGRAM',
      status: 'live',
      tag: 'Messaging',
      desc: 'Broadcast rich announcements, images, and video to public or private channels.',
      color: '#06b6d4',
    },
    {
      id: 'discord',
      name: 'Discord Webhook',
      enum: 'DISCORD',
      status: 'live',
      tag: 'Communities',
      desc: 'Post rich embeds, announcements, and media to server text channels via webhook.',
      color: '#5865f2',
    },
    {
      id: 'x_twitter',
      name: 'X (formerly Twitter)',
      enum: 'X_TWITTER',
      status: 'coming_soon',
      tag: 'Microblogging',
      desc: 'Schedule tweets, threads, polls, and media directly via X API v2.',
      color: '#000000',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      enum: 'LINKEDIN',
      status: 'coming_soon',
      tag: 'Professional',
      desc: 'Post to personal profiles and company pages with carousels and first-comment links.',
      color: '#0a66c2',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      enum: 'INSTAGRAM',
      status: 'coming_soon',
      tag: 'Visual & Reels',
      desc: 'Schedule single photos, carousels, and Instagram Reels with auto-publishing.',
      color: '#e1306c',
    },
    {
      id: 'facebook',
      name: 'Facebook Pages',
      enum: 'FACEBOOK',
      status: 'coming_soon',
      tag: 'Pages & Groups',
      desc: 'Publish updates, high-resolution photos, and videos to Facebook business pages.',
      color: '#1877f2',
    },
    {
      id: 'threads',
      name: 'Threads',
      enum: 'THREADS',
      status: 'coming_soon',
      tag: 'Meta Threads',
      desc: 'Publish conversational threads, images, and updates via Meta Graph API.',
      color: '#111111',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      enum: 'TIKTOK',
      status: 'live',
      tag: 'Short Video',
      desc: 'Upload and schedule short-form videos with custom captions and cover frames.',
      color: '#000000',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      enum: 'YOUTUBE',
      status: 'coming_soon',
      tag: 'Video & Shorts',
      desc: 'Upload YouTube Shorts and full videos with tags, custom thumbnails, and descriptions.',
      color: '#ff0000',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      enum: 'PINTEREST',
      status: 'live',
      tag: 'Visual Bookmarks',
      desc: 'Schedule Pins to targeted boards with destination links and rich descriptions.',
      color: '#bd081c',
    },
    {
      id: 'reddit',
      name: 'Reddit',
      enum: 'REDDIT',
      status: 'live',
      tag: 'Communities',
      desc: 'Post discussions, links, and media to your favorite subreddits.',
      color: '#ff4500',
    },
    {
      id: 'slack',
      name: 'Slack',
      enum: 'SLACK',
      status: 'coming_soon',
      tag: 'Workspaces',
      desc: 'Broadcast internal announcements and social releases to team Slack channels.',
      color: '#4a154b',
    },
  ];

  const presetColors = [
    '#6366f1', // Indigo
    '#0284c7', // Sky
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
  ];

  // Filter channels
  const filteredChannels = channels.filter((c) => {
    const matchesSearch =
      c.accountName.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesProvider = providerFilter === 'ALL' || c.provider === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Health check action
  const handleValidateChannel = async (channel: ChannelItem) => {
    setValidatingId(channel.id);
    try {
      // Simulate/call API
      await new Promise((r) => setTimeout(r, 900));
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, status: 'CONNECTED', lastCheckedAt: 'Just now' } : c))
      );
      toast.success(`Channel ${channel.accountName} is healthy and authenticated!`);
    } catch {
      toast.error(`Health check failed for ${channel.accountName}`);
    } finally {
      setValidatingId(null);
    }
  };

  // Open settings
  const handleOpenSettings = (channel: ChannelItem) => {
    setEditingChannel(channel);
    setSettingName(channel.accountName);
    setSettingColor(channel.color);
    setSettingTimezone(channel.timezone);
    setSettingHashtags(channel.defaultHashtags.join(' '));
    setSettingSignature(channel.signature || '');
    setSettingEnabled(channel.status !== 'DISABLED');
  };

  // Save settings
  const handleSaveSettings = () => {
    if (!editingChannel) return;
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === editingChannel.id) {
          return {
            ...c,
            accountName: settingName,
            color: settingColor,
            timezone: settingTimezone,
            defaultHashtags: settingHashtags
              .split(' ')
              .map((h) => h.trim())
              .filter(Boolean),
            signature: settingSignature,
            status: !settingEnabled ? 'DISABLED' : c.status === 'DISABLED' ? 'CONNECTED' : c.status,
          };
        }
        return c;
      })
    );
    toast.success('Channel settings updated successfully!');
    setEditingChannel(null);
  };

  // Disconnect channel
  const handleConfirmDisconnect = () => {
    if (!disconnectingChannel) return;
    setChannels((prev) => prev.filter((c) => c.id !== disconnectingChannel.id));
    toast.success(`Disconnected ${disconnectingChannel.accountName}`);
    setDisconnectingChannel(null);
  };

  // Connect credential submit
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 1000));

      let newAccountName = '';
      let newProviderEnum = '';
      let defaultColor = '#6366f1';

      if (selectedProviderToConnect === 'bluesky') {
        if (!bskyHandle.trim() || !bskyPassword.trim()) {
          toast.error('Please enter your Bluesky handle and App Password');
          setConnectLoading(false);
          return;
        }
        newAccountName = bskyHandle.startsWith('@') ? bskyHandle : `@${bskyHandle}`;
        newProviderEnum = 'BLUESKY';
        defaultColor = '#0284c7';
      } else if (selectedProviderToConnect === 'mastodon') {
        if (!mastoToken.trim()) {
          toast.error('Please enter your Mastodon access token');
          setConnectLoading(false);
          return;
        }
        const host = mastoInstance.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        newAccountName = `@user@${host}`;
        newProviderEnum = 'MASTODON';
        defaultColor = '#6366f1';
      } else if (selectedProviderToConnect === 'telegram') {
        if (!tgToken.trim() || !tgChatId.trim()) {
          toast.error('Please provide your Telegram Bot Token and Chat ID');
          setConnectLoading(false);
          return;
        }
        newAccountName = tgChatId.startsWith('@') ? tgChatId : `@channel_${tgChatId}`;
        newProviderEnum = 'TELEGRAM';
        defaultColor = '#06b6d4';
      } else if (selectedProviderToConnect === 'discord') {
        if (!discordWebhookUrl.trim()) {
          toast.error('Please provide a Discord Webhook URL');
          setConnectLoading(false);
          return;
        }
        newAccountName = `#${discordUsername.toLowerCase().replace(/\s+/g, '-')}`;
        newProviderEnum = 'DISCORD';
        defaultColor = '#5865f2';
      } else if (selectedProviderToConnect === 'tiktok') {
        newAccountName = tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`;
        newProviderEnum = 'TIKTOK';
        defaultColor = '#000000';
      } else if (selectedProviderToConnect === 'pinterest') {
        newAccountName = pinterestAccount.trim() || 'Pinterest Creator';
        newProviderEnum = 'PINTEREST';
        defaultColor = '#bd081c';
      } else if (selectedProviderToConnect === 'reddit') {
        newAccountName = redditUsername.startsWith('u/') ? redditUsername : `u/${redditUsername}`;
        newProviderEnum = 'REDDIT';
        defaultColor = '#ff4500';
      }

      const newChannel: ChannelItem = {
        id: `chan_${Date.now()}`,
        provider: newProviderEnum,
        accountName: newAccountName,
        status: 'CONNECTED',
        color: defaultColor,
        timezone: 'UTC',
        defaultHashtags: [],
        lastCheckedAt: 'Just now',
        postCount: 0,
      };

      setChannels((prev) => [newChannel, ...prev]);
      toast.success(`Successfully connected ${newAccountName}!`);

      // Reset
      setConnectModalOpen(false);
      setSelectedProviderToConnect(null);
      setBskyHandle('');
      setBskyPassword('');
      setMastoToken('');
      setTgToken('');
      setTgChatId('');
      setDiscordWebhookUrl('');
    } catch {
      toast.error('Failed to connect channel. Please check your credentials.');
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <AppShell activeNav="channels">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('title')}</h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {t('planLimit', { used: channels.length, limit: 10, plan: 'Pro' })}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>

          <Button
            onClick={() => {
              setSelectedProviderToConnect(null);
              setConnectModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('connectButton')}</span>
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card/60 p-3 rounded-2xl border border-border backdrop-blur-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9 bg-background/50 border-border/70 text-xs sm:text-sm h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">{t('filterStatus')}</option>
              <option value="CONNECTED">{t('statusActive')}</option>
              <option value="NEEDS_REAUTH">{t('statusNeedsReauth')}</option>
              <option value="DISABLED">{t('statusDisabled')}</option>
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-background/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">{t('filterAll')}</option>
              <option value="BLUESKY">Bluesky</option>
              <option value="MASTODON">Mastodon</option>
              <option value="TELEGRAM">Telegram</option>
              <option value="DISCORD">Discord</option>
            </select>
          </div>
        </div>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <EmptyState
            icon={Share2}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            actionLabel={t('connectButton')}
            onActionClick={() => {
              setSelectedProviderToConnect(null);
              setConnectModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChannels.map((channel) => {
              const isValidating = validatingId === channel.id;
              const isNeedsReauth = channel.status === 'NEEDS_REAUTH';
              const isDisabled = channel.status === 'DISABLED';

              return (
                <Card
                  key={channel.id}
                  className="overflow-hidden border border-border/80 bg-card/60 backdrop-blur-md hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Channel Badge / Color indicator */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                          style={{ backgroundColor: channel.color }}
                        >
                          {channel.provider.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-bold truncate flex items-center gap-1.5">
                            <span className="truncate">{channel.accountName}</span>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{channel.provider.toLowerCase()}</p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 flex items-center">
                        {channel.status === 'CONNECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap shrink-0 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="whitespace-nowrap">{t('statusActive')}</span>
                          </span>
                        )}
                        {channel.status === 'NEEDS_REAUTH' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProviderToConnect(channel.provider.toLowerCase());
                              setConnectModalOpen(true);
                            }}
                            title={t('reconnect')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap shrink-0 shadow-sm hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer select-none [word-break:keep-all]"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap [word-break:keep-all]">{t('statusNeedsReauth')}</span>
                          </button>
                        )}
                        {channel.status === 'DISABLED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border whitespace-nowrap shrink-0 select-none">
                            <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{t('statusDisabled')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-muted-foreground pb-4">
                    <div className="flex items-center justify-between py-1 border-t border-border/50">
                      <span>Health check</span>
                      <span className="font-medium text-foreground">{channel.lastCheckedAt}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-border/50">
                      <span>Timezone</span>
                      <span className="font-medium text-foreground">{channel.timezone}</span>
                    </div>

                    {channel.defaultHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {channel.defaultHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleValidateChannel(channel)}
                        disabled={isValidating}
                        className="h-8 px-2 text-xs flex items-center gap-1"
                        title={t('validate')}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{t('validate')}</span>
                      </Button>

                      {isNeedsReauth && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProviderToConnect(channel.provider.toLowerCase());
                            setConnectModalOpen(true);
                          }}
                          className="h-8 px-2 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{t('reconnect')}</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenSettings(channel)}
                        className="h-8 px-2 text-xs"
                        title={t('settings')}
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDisconnectingChannel(channel)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        title={t('disconnect')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Channel Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  <span>{t('connectModalTitle')}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('connectModalDesc')}</p>
              </div>
              <button
                onClick={() => {
                  setConnectModalOpen(false);
                  setSelectedProviderToConnect(null);
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {!selectedProviderToConnect ? (
                <div className="space-y-6">
                  {/* Category Tabs */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/60 border border-border">
                      <button
                        onClick={() => setConnectTab('live')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          connectTab === 'live'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t('tabLive')} (4)
                      </button>
                      <button
                        onClick={() => setConnectTab('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          connectTab === 'all'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t('tabAll')} (14)
                      </button>
                    </div>

                    <div className="relative w-48 hidden sm:block">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        placeholder="Search networks..."
                        className="w-full pl-8 pr-3 py-1 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Provider Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allProviders
                      .filter((p) => {
                        if (connectTab === 'live' && p.status !== 'live') return false;
                        if (providerSearch) {
                          return (
                            p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
                            p.tag.toLowerCase().includes(providerSearch.toLowerCase())
                          );
                        }
                        return true;
                      })
                      .map((p) => {
                        const isLive = p.status === 'live';
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (isLive) {
                                setSelectedProviderToConnect(p.id);
                              } else {
                                toast.info(`We'll notify you when ${p.name} integration launches!`, {
                                  description: 'API v2 developer hooks are actively staged.',
                                });
                              }
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                              isLive
                                ? 'border-border/80 bg-card/80 hover:border-primary/50 hover:bg-secondary/40 shadow-sm'
                                : 'border-border/40 bg-card/30 opacity-75 hover:opacity-100 hover:border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                                  style={{ backgroundColor: p.color }}
                                >
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                    {p.name}
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground font-mono">{p.tag}</span>
                                </div>
                              </div>

                              {isLive ? (
                                <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  Live
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] text-muted-foreground">
                                  {t('comingSoon')}
                                </Badge>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{p.desc}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                /* Specific Provider Connect Form */
                <div>
                  <button
                    onClick={() => setSelectedProviderToConnect(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to all providers</span>
                  </button>

                  {/* Bluesky Connect Form */}
                  {selectedProviderToConnect === 'bluesky' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-sky-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-sky-200">Connect via AT Protocol App Password</p>
                          <p className="mt-1">
                            For security, please use a dedicated{' '}
                            <a
                              href="https://bsky.app/settings/app-passwords"
                              target="_blank"
                              rel="noreferrer"
                              className="underline font-semibold text-white hover:text-sky-200"
                            >
                              Bluesky App Password
                            </a>{' '}
                            rather than your primary account password.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Bluesky Handle / Identifier</label>
                        <Input
                          placeholder="yourhandle.bsky.social"
                          value={bskyHandle}
                          onChange={(e) => setBskyHandle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">App Password</label>
                        <Input
                          type="password"
                          placeholder="xxxx-xxxx-xxxx-xxxx"
                          value={bskyPassword}
                          onChange={(e) => setBskyPassword(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4">
                        {connectLoading ? 'Authenticating & Verifying...' : 'Connect Bluesky Account'}
                      </Button>
                    </form>
                  )}

                  {/* Mastodon Connect Form */}
                  {selectedProviderToConnect === 'mastodon' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-indigo-200">Federated Mastodon Publishing</p>
                          <p className="mt-1">
                            Orbitly works with any Mastodon instance. Obtain an Access Token in your instance’s{' '}
                            <span className="font-semibold text-white">Preferences &gt; Development</span>.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Instance URL</label>
                        <Input
                          placeholder="https://mastodon.social"
                          value={mastoInstance}
                          onChange={(e) => setMastoInstance(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">User Access Token</label>
                        <Input
                          type="password"
                          placeholder="Paste access token with read + write scopes"
                          value={mastoToken}
                          onChange={(e) => setMastoToken(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4">
                        {connectLoading ? 'Verifying Instance & Token...' : 'Connect Mastodon Profile'}
                      </Button>
                    </form>
                  )}

                  {/* Telegram Connect Form */}
                  {selectedProviderToConnect === 'telegram' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-cyan-200">Connect Telegram Bot &amp; Channel</p>
                          <p className="mt-1">
                            1. Message <span className="font-semibold text-white">@BotFather</span> to create a bot and
                            get a Token.
                            <br />
                            2. Add your bot as an <span className="font-semibold text-white">Administrator</span> to
                            your Telegram channel with "Post Messages" permission.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Bot API Token</label>
                        <Input
                          type="password"
                          placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          value={tgToken}
                          onChange={(e) => setTgToken(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Channel Username or Chat ID</label>
                        <Input
                          placeholder="@my_channel_username or -1001234567890"
                          value={tgChatId}
                          onChange={(e) => setTgChatId(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4">
                        {connectLoading ? 'Validating Telegram Bot...' : 'Connect Telegram Channel'}
                      </Button>
                    </form>
                  )}

                  {/* Discord Connect Form */}
                  {selectedProviderToConnect === 'discord' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-indigo-200">Discord Channel Webhook</p>
                          <p className="mt-1">
                            In your Discord Server Settings &gt; Integrations &gt; Webhooks, create a webhook for your
                            desired announcements channel and paste its URL below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Discord Webhook URL</label>
                        <Input
                          type="password"
                          placeholder="https://discord.com/api/webhooks/..."
                          value={discordWebhookUrl}
                          onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Channel Display Label</label>
                        <Input
                          placeholder="e.g. #announcements"
                          value={discordUsername}
                          onChange={(e) => setDiscordUsername(e.target.value)}
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4">
                        {connectLoading ? 'Checking Discord Webhook...' : 'Connect Discord Webhook'}
                      </Button>
                    </form>
                  )}

                  {/* TikTok Connect Form */}
                  {selectedProviderToConnect === 'tiktok' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-white mt-0.5" />
                        <div>
                          <p className="font-bold text-white">TikTok Content Posting API (v2)</p>
                          <p className="mt-1">
                            Link your TikTok creator profile or business account for scheduled short-form video publishing with custom cover frames.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">TikTok Username / Handle</label>
                        <Input
                          placeholder="@brand_creator"
                          value={tiktokHandle}
                          onChange={(e) => setTiktokHandle(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4 bg-zinc-900 hover:bg-black text-white">
                        {connectLoading ? 'Authorizing with TikTok...' : 'Authorize TikTok Account'}
                      </Button>
                    </form>
                  )}

                  {/* Pinterest Connect Form */}
                  {selectedProviderToConnect === 'pinterest' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-200">Pinterest Business API v5</p>
                          <p className="mt-1">
                            Connect your Pinterest business account to publish image and video Pins with custom board targeting and destination links.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Account Label</label>
                        <Input
                          placeholder="My Pinterest Brand"
                          value={pinterestAccount}
                          onChange={(e) => setPinterestAccount(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4 bg-[#e60023] hover:bg-[#ad081b] text-white">
                        {connectLoading ? 'Authorizing Pinterest API...' : 'Authorize Pinterest Account'}
                      </Button>
                    </form>
                  )}

                  {/* Reddit Connect Form */}
                  {selectedProviderToConnect === 'reddit' && (
                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex items-start gap-3">
                        <Info className="w-5 h-5 shrink-0 text-orange-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-orange-200">Reddit API Integration</p>
                          <p className="mt-1">
                            Submit community discussions, release announcements, and links to your targeted subreddits with flair and NSFW support.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Reddit Username</label>
                        <Input
                          placeholder="u/brand_official"
                          value={redditUsername}
                          onChange={(e) => setRedditUsername(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={connectLoading} className="w-full mt-4 bg-[#ff4500] hover:bg-[#d83a00] text-white">
                        {connectLoading ? 'Authorizing Reddit OAuth...' : 'Authorize Reddit Account'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Channel Settings Drawer / Dialog */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">{t('settingsTitle')}</h3>
              <button
                onClick={() => setEditingChannel(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('displayName')}</label>
                <Input value={settingName} onChange={(e) => setSettingName(e.target.value)} />
              </div>

              {/* Color Picker Swatches */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">{t('badgeColor')}</label>
                <div className="flex items-center gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSettingColor(color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        settingColor === color ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {settingColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('timezone')}</label>
                <select
                  value={settingTimezone}
                  onChange={(e) => setSettingTimezone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST / EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                  <option value="Europe/London">Europe/London (GMT / BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET / CEST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('defaultHashtags')}</label>
                <Input
                  value={settingHashtags}
                  onChange={(e) => setSettingHashtags(e.target.value)}
                  placeholder="#tech #marketing"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('defaultSignature')}</label>
                <textarea
                  value={settingSignature}
                  onChange={(e) => setSettingSignature(e.target.value)}
                  placeholder="e.g. — Published with Orbitly"
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border">
                <div>
                  <p className="font-semibold text-foreground">{t('enablePublishing')}</p>
                  <p className="text-[11px] text-muted-foreground">Allows automatic scheduler to dispatch posts</p>
                </div>
                <input
                  type="checkbox"
                  checked={settingEnabled}
                  onChange={(e) => setSettingEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setEditingChannel(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>{t('saveSettings')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {disconnectingChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-destructive/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-center font-bold text-lg text-foreground">
              Disconnect {disconnectingChannel.accountName}?
            </h3>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              {t('disconnectConfirm')}
            </p>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={() => setDisconnectingChannel(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDisconnect}>
                {t('disconnect')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}