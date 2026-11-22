'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformPreview } from '@/components/composer/PlatformPreview';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

export default function ApprovalsPage() {
  const t = useTranslations('Approvals');
  const workspaceId = 'ws_demo_1';

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInbox = async () => {
    try {
      const res = await fetch(`http://localhost:4000/approvals`, {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.items || []);
        if (data.items?.length > 0 && !selectedPostId) {
          setSelectedPostId(data.items[0].id);
        }
      }
    } catch {
      // Demo mock data
      setPosts([
        {
          id: 'post_appr_1',
          title: 'Q4 Product Showcase',
          status: 'PENDING_APPROVAL',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          approvalVersion: 2,
          tags: ['announcement', 'q4'],
          author: { name: 'Devon Miles', email: 'devon@orbitly.io' },
          variants: [
            {
              id: 'var_1',
              channel: { provider: 'BLUESKY', accountName: '@orbitly.bsky.social' },
              content: 'Excited to announce our major Q4 release! 🚀 Scheduling and approvals are now live.',
              mediaUrls: [],
              thread: [],
            },
            {
              id: 'var_2',
              channel: { provider: 'DISCORD', accountName: 'Announcements #general' },
              content: 'Community update: Orbitly Step 6 is officially live! Check out the new team workflows.',
              mediaUrls: [],
              thread: [],
            },
          ],
          approvals: [
            {
              version: 1,
              status: 'CHANGES_REQUESTED',
              note: 'Please polish the Discord copy before final approval.',
            },
          ],
        },
      ]);
      setSelectedPostId('post_appr_1');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const selectedPost = posts.find((p) => p.id === selectedPostId);

  const handleApprove = async () => {
    if (!selectedPost) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/posts/${selectedPost.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ note: feedbackNote || 'Approved' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Approval failed');
      }
      toast.success('Post approved and scheduled!');
      setFeedbackNote('');
      loadInbox();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedPost) return;
    if (!feedbackNote.trim()) {
      toast.error('Please enter feedback explaining the requested changes.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/posts/${selectedPost.id}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ note: feedbackNote }),
      });
      if (!res.ok) throw new Error('Failed to request changes');
      toast.success('Changes requested. Post returned to author draft.');
      setFeedbackNote('');
      loadInbox();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    if (!confirm('Are you sure you want to reject this post? It will be marked CANCELLED.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/posts/${selectedPost.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ reason: feedbackNote || 'Rejected by reviewer' }),
      });
      if (!res.ok) throw new Error('Failed to reject post');
      toast.success('Post rejected');
      setFeedbackNote('');
      loadInbox();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell activeNav="approvals">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>

          <Badge variant="outline" className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {t('pendingCount', { count: posts.length })}
          </Badge>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t('emptyInbox')}
            description="Drafts submitted by editors will appear here for side-by-side review and approval."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Queue ({posts.length})
              </div>

              <div className="space-y-2">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedPostId === post.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {post.title || post.variants?.[0]?.content?.slice(0, 30) || 'Untitled Post'}
                      </span>
                      {post.approvalVersion > 1 && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          v{post.approvalVersion}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground truncate mb-2">
                      by {post.author?.name || post.author?.email}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'Draft'}
                      </span>
                      <span className="font-medium text-primary">
                        {post.variants?.length || 0} channel(s)
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Detailed Preview & Decision Controls */}
            {selectedPost && (
              <div className="lg:col-span-8 space-y-6">
                {/* Changed since approved Banner */}
                {selectedPost.approvalVersion > 1 && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-semibold">
                        {t('diffBanner', { version: selectedPost.approvalVersion })}
                      </div>
                      <div className="text-[11px] opacity-90">
                        The author modified this post after previous feedback. Re-review changes below.
                      </div>
                    </div>
                  </div>
                )}

                {/* Platform Previews */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cross-Platform Live Previews
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPost.variants?.map((v: any) => (
                      <div key={v.id} className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground">
                          {v.channel?.accountName || v.channel?.provider}
                        </div>
                        <PlatformPreview
                          provider={v.channel?.provider || 'BLUESKY'}
                          accountName={v.channel?.accountName || 'Orbitly Account'}
                          avatarUrl={v.channel?.avatar}
                          content={v.content}
                          mediaUrls={v.mediaUrls || []}
                          thread={v.thread || []}
                          firstComment={v.firstComment}
                          discordSettings={v.settings}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviewer Decision Controls */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reviewer Decision & Notes
                  </div>

                  <textarea
                    rows={3}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Add feedback notes or instructions for the author..."
                    className="w-full text-xs rounded-xl border border-input bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      {t('reject')}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRequestChanges}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        {t('requestChanges')}
                      </Button>

                      <Button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {t('approve')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
