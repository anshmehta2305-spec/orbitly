'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Lock, Copy, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ShareLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  channels: Array<{ id: string; provider: string; accountName: string }>;
  onSuccess: () => void;
}

export function ShareLinkModal({
  open,
  onOpenChange,
  workspaceId,
  channels,
  onSuccess,
}: ShareLinkModalProps) {
  const [name, setName] = useState('Q4 Client Review');
  const [scope, setScope] = useState<'CALENDAR' | 'SELECTED_POSTS'>('CALENDAR');
  const [password, setPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowApprove, setAllowApprove] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdLinkUrl, setCreatedLinkUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:4000/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({
          name,
          scope,
          channelIds: selectedChannels,
          password: requirePassword ? password : null,
          allowComments,
          allowApprove,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create share link');

      toast.success('Client review link created!');
      setCreatedLinkUrl(data.shareUrl);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    );
  };

  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Create Client Share Link"
      description="Generate a secure, read-only review portal for clients to inspect and approve content without logging in."
    >
      <div>
        {createdLinkUrl ? (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Share link is live! Clients can review posts securely.</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg font-mono text-xs break-all">
              <span className="flex-1 select-all">{createdLinkUrl}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(createdLinkUrl);
                  toast.success('Copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>
            <div className="pt-3 flex justify-end">
              <Button
                onClick={() => {
                  setCreatedLinkUrl(null);
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Portal Label / Client Name
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Q4 Campaign Review"
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Review Scope
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScope('CALENDAR')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    scope === 'CALENDAR' ? 'border-primary bg-primary/5 font-semibold' : 'border-border'
                  }`}
                >
                  Whole Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setScope('SELECTED_POSTS')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    scope === 'SELECTED_POSTS' ? 'border-primary bg-primary/5 font-semibold' : 'border-border'
                  }`}
                >
                  Selected Channels
                </button>
              </div>
            </div>

            {scope === 'SELECTED_POSTS' && channels.length > 0 && (
              <div className="p-2 border border-border rounded-lg max-h-32 overflow-y-auto space-y-1">
                {channels.map((chan) => (
                  <label key={chan.id} className="flex items-center gap-2 text-xs p-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(chan.id)}
                      onChange={() => toggleChannel(chan.id)}
                      className="rounded text-primary"
                    />
                    <span className="truncate">{chan.accountName}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Password toggle */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Password Protection
                </span>
                <input
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="rounded text-primary"
                />
              </div>

              {requirePassword && (
                <Input
                  type="password"
                  required
                  placeholder="Set client password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex items-center justify-between">
                <span>Allow client comments</span>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="rounded text-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Allow client post approvals</span>
                <input
                  type="checkbox"
                  checked={allowApprove}
                  onChange={(e) => setAllowApprove(e.target.checked)}
                  className="rounded text-primary"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Create Share Link'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

