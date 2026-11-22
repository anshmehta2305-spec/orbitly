'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Check, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  channels: Array<{ id: string; provider: string; accountName: string }>;
  onSuccess: () => void;
}

export function InviteModal({
  open,
  onOpenChange,
  workspaceId,
  channels,
  onSuccess,
}: InviteModalProps) {
  const t = useTranslations('Team');
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [email, setEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [restrictChannels, setRestrictChannels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'single') {
        const res = await fetch(`http://localhost:4000/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify({
            email,
            role,
            channelIds: restrictChannels ? selectedChannels : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send invitation');

        toast.success(`Invitation sent to ${email}`);
        if (data.invitation?.inviteUrl) {
          setCreatedInviteUrl(data.invitation.inviteUrl);
        } else {
          onSuccess();
          onOpenChange(false);
        }
      } else {
        const emailsArray = bulkEmails
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter(Boolean);

        if (emailsArray.length === 0) {
          throw new Error('Please enter at least one valid email address');
        }

        const res = await fetch(`http://localhost:4000/invitations/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify({
            emails: emailsArray,
            role,
            channelIds: restrictChannels ? selectedChannels : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send bulk invitations');

        toast.success(`Sent ${data.sentCount} invitations (${data.skippedCount} skipped)`);
        onSuccess();
        onOpenChange(false);
      }
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
      title={t('inviteMember')}
      description="Invite teammates to collaborate on social calendar planning and publishing."
    >
      <div>
        {createdInviteUrl ? (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-5 h-5 shrink-0" />
              <span>Invitation created successfully! Share this link with your teammate:</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg font-mono text-xs break-all">
              <span className="flex-1 select-all">{createdInviteUrl}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(createdInviteUrl);
                  toast.success('Invite link copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>
            <div className="pt-3 flex justify-end">
              <Button
                onClick={() => {
                  setCreatedInviteUrl(null);
                  setEmail('');
                  onSuccess();
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="single">Single Invite</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Invite</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-3 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-3 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paste Multiple Emails (comma or line separated)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="alex@agency.com&#10;taylor@agency.com&#10;jordan@client.com"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-input bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </TabsContent>
            </Tabs>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'ADMIN'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="font-semibold text-xs">Admin</div>
                  <div className="text-[10px] text-muted-foreground">Approve posts & manage members</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('EDITOR')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'EDITOR'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="font-semibold text-xs">Editor</div>
                  <div className="text-[10px] text-muted-foreground">Create, draft & submit content</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('VIEWER')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'VIEWER'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="font-semibold text-xs">Viewer</div>
                  <div className="text-[10px] text-muted-foreground">View calendar & comment only</div>
                </button>
              </div>
            </div>

            {/* Channel restriction checkbox */}
            {role === 'EDITOR' && channels.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Limit access to specific channels</span>
                  <input
                    type="checkbox"
                    checked={restrictChannels}
                    onChange={(e) => setRestrictChannels(e.target.checked)}
                    className="rounded border-input text-primary"
                  />
                </div>

                {restrictChannels && (
                  <div className="grid grid-cols-2 gap-1.5 p-2 bg-muted/40 rounded-lg max-h-36 overflow-y-auto">
                    {channels.map((chan) => (
                      <label
                        key={chan.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                      >
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
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

