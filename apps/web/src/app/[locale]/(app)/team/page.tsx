'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Key,
  Globe,
  Trash2,
  RefreshCw,
  ExternalLink,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { InviteModal } from '@/components/team/InviteModal';
import { ShareLinkModal } from '@/components/team/ShareLinkModal';

export default function TeamPage() {
  const t = useTranslations('Team');
  const params = useParams();
  const workspaceId = 'ws_demo_1';

  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [seatUsage, setSeatUsage] = useState<any>({ seatsUsed: 1, maxSeats: 10, tier: 'TEAM' });
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [membersRes, shareRes, channelsRes] = await Promise.all([
        fetch('http://localhost:4000/members', {
          headers: { 'x-workspace-id': workspaceId },
        }),
        fetch('http://localhost:4000/share-links', {
          headers: { 'x-workspace-id': workspaceId },
        }),
        fetch('http://localhost:4000/channels', {
          headers: { 'x-workspace-id': workspaceId },
        }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
        setInvitations(data.pendingInvitations || []);
        if (data.seatUsage) setSeatUsage(data.seatUsage);
      }

      if (shareRes.ok) {
        const data = await shareRes.json();
        setShareLinks(data || []);
      }

      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data || []);
      }
    } catch {
      // Fallback demo data if API not active
      setMembers([
        {
          id: 'mem_1',
          role: 'OWNER',
          createdAt: new Date().toISOString(),
          user: {
            id: 'u_1',
            name: 'Sarah Connor',
            email: 'sarah@orbitly.io',
            avatar: null,
          },
          channelAccess: [],
        },
        {
          id: 'mem_2',
          role: 'EDITOR',
          createdAt: new Date().toISOString(),
          user: {
            id: 'u_2',
            name: 'Devon Miles',
            email: 'devon@orbitly.io',
            avatar: null,
          },
          channelAccess: [{ id: 'ch_1', accountName: 'Bluesky @orbitly' }],
        },
      ]);
      setInvitations([
        {
          id: 'inv_1',
          email: 'alex@growthagency.com',
          role: 'ADMIN',
          expires: new Date(Date.now() + 6 * 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
      setShareLinks([
        {
          id: 'sl_1',
          name: 'Acme Q4 Review',
          scope: 'CALENDAR',
          hasPassword: true,
          allowComments: true,
          allowApprove: true,
          isActive: true,
          viewCount: 14,
          lastViewedAt: new Date().toISOString(),
          reviewersCount: 2,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`http://localhost:4000/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      toast.success('Member role updated');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`http://localhost:4000/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove member');
      toast.success('Member removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) throw new Error('Failed to revoke invitation');
      toast.success('Invitation revoked');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: { 'x-workspace-id': workspaceId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend invite');
      toast.success('Invitation resent with refreshed 7-day expiry');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRevokeShareLink = async (shareLinkId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/share-links/${shareLinkId}/revoke`, {
        method: 'POST',
        headers: { 'x-workspace-id': workspaceId },
      });
      if (!res.ok) throw new Error('Failed to revoke share link');
      toast.success('Client share link revoked');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell activeNav="team">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShareModalOpen(true)}>
              <Globe className="w-4 h-4 mr-1.5 text-primary" />
              Client Share Links
            </Button>
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              {t('inviteMember')}
            </Button>
          </div>
        </div>

        {/* Seat Usage Bar */}
        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Seat Quota ({seatUsage.tier} Tier)
            </div>
            <div className="text-sm font-medium">
              {seatUsage.seatsUsed} active + {invitations.length} pending of {seatUsage.maxSeats} total seats
            </div>
          </div>
          <div className="w-full sm:w-64 bg-muted h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  ((seatUsage.seatsUsed + invitations.length) / (seatUsage.maxSeats || 1)) * 100,
                )}%`,
              }}
            />
          </div>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="members" className="rounded-lg text-xs font-medium">
              Active Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-lg text-xs font-medium">
              Pending Invitations ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="shareLinks" className="rounded-lg text-xs font-medium">
              Client Share Links ({shareLinks.length})
            </TabsTrigger>
          </TabsList>

          {/* Members Table */}
          <TabsContent value="members" className="space-y-3">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Channel Access</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                            {m.user?.name?.[0]?.toUpperCase() || m.user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {m.user?.name || 'Unnamed User'}
                              {m.role === 'OWNER' && (
                                <span title="Workspace Owner">
                                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {m.role === 'OWNER' ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            Owner
                          </Badge>
                        ) : (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="text-xs rounded-lg border border-input bg-background px-2.5 py-1.5 font-medium cursor-pointer"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {m.role === 'ADMIN' || m.role === 'OWNER' ? (
                          <span className="text-xs text-muted-foreground">All Channels (Unrestricted)</span>
                        ) : m.channelAccess && m.channelAccess.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.channelAccess.map((c: any) => (
                              <Badge key={c.id} variant="secondary" className="text-[10px]">
                                {c.accountName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">All Channels</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {m.role !== 'OWNER' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Pending Invitations Table */}
          <TabsContent value="invitations" className="space-y-3">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Invited Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Expires</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs">
                        No pending invitations. Click &quot;Invite Member&quot; to add teammates.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-medium">{inv.email}</td>
                        <td className="px-5 py-4">
                          <Badge variant="outline">{inv.role}</Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {new Date(inv.expires).toLocaleDateString()} (7-day link)
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleResendInvite(inv.id)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeInvite(inv.id)}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Share Links Table */}
          <TabsContent value="shareLinks" className="space-y-3">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Portal Name</th>
                    <th className="px-5 py-3.5">Scope</th>
                    <th className="px-5 py-3.5">Security</th>
                    <th className="px-5 py-3.5">Views</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shareLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-xs">
                        No active share links. Click &quot;Client Share Links&quot; to create a client review portal.
                      </td>
                    </tr>
                  ) : (
                    shareLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-medium">{link.name}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {link.scope === 'CALENDAR' ? 'Whole Calendar' : 'Specific Channels'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {link.hasPassword ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                                Password Protected
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Public Link
                              </Badge>
                            )}
                            {link.allowApprove && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Approvals Allowed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {link.viewCount} views ({link.reviewersCount} client reviewers)
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeShareLink(link.id)}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <InviteModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          workspaceId={workspaceId}
          channels={channels}
          onSuccess={loadData}
        />

        <ShareLinkModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          workspaceId={workspaceId}
          channels={channels}
          onSuccess={loadData}
        />
      </div>
    </AppShell>
  );
}
