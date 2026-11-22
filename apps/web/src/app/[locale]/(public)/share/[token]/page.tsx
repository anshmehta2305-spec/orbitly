'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PlatformPreview } from '@/components/composer/PlatformPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Globe,
  Clock,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Send,
  User,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicSharePortalPage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [meta, setMeta] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [identified, setIdentified] = useState(false);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(`http://localhost:4000/public/share/${token}/meta`);
        if (!res.ok) {
          if (token.startsWith('demo_')) {
            setMeta({
              name: 'Acme Client Campaign Q4',
              requiresPassword: true,
              allowComments: true,
              allowApprove: true,
              brand: { brandName: 'Client Review Portal', brandColor: '#4F46E5' },
            });
            return;
          }
          const d = await res.json();
          throw new Error(d.message || 'Share link is not available');
        }
        const data = await res.json();
        setMeta(data);
        if (!data.requiresPassword) {
          setUnlocked(true);
          loadPosts();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [token]);

  const loadPosts = async () => {
    try {
      const res = await fetch(`http://localhost:4000/public/share/${token}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data || []);
      } else if (token.startsWith('demo_')) {
        setPosts([
          {
            id: 'post_demo_1',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'IN_REVIEW',
            variants: [
              {
                id: 'var_1',
                channel: { provider: 'LINKEDIN', accountName: 'Acme Corp' },
                content: 'Upcoming Q4 Launch announcement! #growth #scale',
              },
            ],
            comments: [],
          },
        ]);
      }
    } catch {
      if (token.startsWith('demo_')) {
        setPosts([
          {
            id: 'post_demo_1',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'IN_REVIEW',
            variants: [
              {
                id: 'var_1',
                channel: { provider: 'LINKEDIN', accountName: 'Acme Corp' },
                content: 'Upcoming Q4 Launch announcement! #growth #scale',
              },
            ],
            comments: [],
          },
        ]);
      }
    }
  };

  const handleUnlockPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:4000/public/share/${token}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setUnlocked(true);
        loadPosts();
      } else if (token.startsWith('demo_') && password === 'clientSecret123') {
        setUnlocked(true);
        loadPosts();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Incorrect password');
      }
    } catch (err: any) {
      if (token.startsWith('demo_') && password === 'clientSecret123') {
        setUnlocked(true);
        loadPosts();
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewerEmail) {
      toast.error('Name and email required');
      return;
    }
    setIdentified(true);
    fetch(`http://localhost:4000/public/share/${token}/reviewer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: reviewerName, email: reviewerEmail }),
    }).catch(() => {});
  };

  const handleClientDecide = async (postId: string, decision: 'APPROVE' | 'REQUEST_CHANGES') => {
    if (!identified) {
      toast.error('Please enter your name and email above to approve or comment.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/public/share/${token}/posts/${postId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName,
          reviewerEmail,
          decision,
          note: decision === 'APPROVE' ? 'Approved by client' : 'Changes requested by client',
        }),
      });

      if (!res.ok) throw new Error('Action failed');
      toast.success(decision === 'APPROVE' ? 'Post approved!' : 'Changes requested.');
      loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!identified) {
      toast.error('Please enter your name and email to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:4000/public/share/${token}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName,
          reviewerEmail,
          content: newComment,
        }),
      });

      if (!res.ok) throw new Error('Comment failed');
      toast.success('Comment added');
      setNewComment('');
      setActiveCommentPostId(null);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground animate-pulse">Loading review portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Portal Unavailable</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* White-label Client Header */}
      <header
        className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md px-6 py-4 flex items-center justify-between"
        style={{ borderTopColor: meta?.brand?.brandColor || '#4F46E5', borderTopWidth: 3 }}
      >
        <div className="flex items-center gap-3">
          {meta?.brand?.brandLogo ? (
            <img src={meta.brand.brandLogo} alt="Logo" className="h-7 w-auto object-contain" />
          ) : (
            <div className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {meta?.brand?.brandName || 'Client Review Portal'}
            </div>
          )}
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            • {meta?.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {meta?.allowApprove && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              Client Approvals Enabled
            </Badge>
          )}
        </div>
      </header>

      {/* Password Gate */}
      {!unlocked ? (
        <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-border bg-card shadow-lg space-y-4 text-center">
          <Lock className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Protected Review Portal</h2>
          <p className="text-sm text-muted-foreground">
            Please enter the client review password to access this calendar.
          </p>
          <form onSubmit={handleUnlockPassword} className="space-y-3">
            <Input
              type="password"
              required
              placeholder="Enter review password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Unlock Portal
            </Button>
          </form>
        </div>
      ) : (
        <main className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Identity Gate Banner */}
          {!identified && (
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Identify yourself to comment and approve
                </div>
                <div className="text-xs text-muted-foreground">
                  Your feedback and decisions will be signed with your name.
                </div>
              </div>

              <form onSubmit={handleIdentify} className="flex items-center gap-2">
                <Input
                  required
                  placeholder="Your Name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <Input
                  required
                  type="email"
                  placeholder="Your Email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  className="h-8 text-xs w-44"
                />
                <Button size="sm" type="submit" className="h-8 text-xs shrink-0">
                  Save
                </Button>
              </form>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Upcoming Scheduled Posts ({posts.length})</h3>
            </div>

            {posts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm border border-dashed rounded-2xl">
                No scheduled posts in this review scope.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold">
                          {post.scheduledAt
                            ? new Date(post.scheduledAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Draft'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {post.status}
                      </Badge>
                    </div>

                    {/* Previews */}
                    <div className="space-y-3">
                      {post.variants?.map((v: any) => (
                        <PlatformPreview
                          key={v.id}
                          provider={v.channel?.provider || v.provider || 'LINKEDIN'}
                          accountName={v.channel?.accountName || v.accountName || 'Acme Corp'}
                          avatarUrl={v.avatar}
                          content={v.content}
                          mediaUrls={v.mediaUrls || []}
                          thread={v.thread || []}
                          discordSettings={v.settings}
                        />
                      ))}
                    </div>

                    {/* Client Approval Controls */}
                    {meta?.allowApprove && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClientDecide(post.id, 'REQUEST_CHANGES')}
                        >
                          Request Changes
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleClientDecide(post.id, 'APPROVE')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve Post
                        </Button>
                      </div>
                    )}

                    {/* Comments Section */}
                    {meta?.allowComments && (
                      <div className="space-y-2 pt-2 border-t border-border text-xs">
                        <div className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Comments ({post.comments?.length || 0})
                        </div>

                        {post.comments?.map((c: any) => (
                          <div key={c.id} className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                            <div className="font-medium text-[11px] text-foreground">
                              {c.authorName}
                            </div>
                            <div className="text-muted-foreground">{c.content}</div>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <Input
                            placeholder="Add your feedback..."
                            value={activeCommentPostId === post.id ? newComment : ''}
                            onFocus={() => setActiveCommentPostId(post.id)}
                            onChange={(e) => {
                              setActiveCommentPostId(post.id);
                              setNewComment(e.target.value);
                            }}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleSendComment(post.id)}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
