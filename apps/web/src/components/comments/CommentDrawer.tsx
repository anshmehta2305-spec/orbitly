'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  Paperclip,
  Trash2,
  X,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommentDrawerProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  workspaceId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function CommentDrawer({
  open,
  onClose,
  postId,
  workspaceId,
  currentUserId,
  currentUserRole,
}: CommentDrawerProps) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [comments, setComments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/comments`, {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data || []);
      }
    } catch {
      // Ignored
    }
  };

  const loadActivity = async () => {
    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/activity`, {
        headers: { 'x-workspace-id': workspaceId },
      });
      if (res.ok) {
        const data = await res.json();
        setActivity(data || []);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (open && postId) {
      loadComments();
      loadActivity();
    }
  }, [open, postId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:4000/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to post comment');
      toast.success('Comment posted');
      setNewComment('');
      setReplyingTo(null);
      loadComments();
      loadActivity();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await fetch(`http://localhost:4000/posts/${postId}/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: { 'x-workspace-id': workspaceId },
      });
      loadComments();
    } catch {
      // Ignored
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('comments')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'comments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'activity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Activity Timeline
          </button>
        </div>

        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'comments' ? (
          comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No comments yet. Start the conversation with your team!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2 p-3 rounded-xl border border-border bg-background">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{comment.author?.name || comment.sharedViewerName || 'Anonymous'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground/90">{comment.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="hover:text-primary font-medium"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleResolve(comment.id)}
                    className="hover:text-emerald-500 font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {comment.resolvedAt ? 'Resolved' : 'Resolve'}
                  </button>
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-3 border-l-2 border-primary/20 space-y-2 mt-2">
                    {comment.replies.map((reply: any) => (
                      <div key={reply.id} className="text-xs space-y-0.5">
                        <div className="font-medium text-[11px]">
                          {reply.author?.name || reply.sharedViewerName}
                        </div>
                        <div className="text-muted-foreground">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          <div className="space-y-3">
            {activity.map((act) => (
              <div key={act.id} className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-medium">{act.action.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-muted-foreground">
                    by {act.actor?.name || 'System'} • {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {tab === 'comments' && (
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-background space-y-2">
          {replyingTo && (
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Replying to thread...</span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-destructive">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave feedback or @mention..."
              className="text-xs"
            />
            <Button size="sm" type="submit" disabled={loading}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
