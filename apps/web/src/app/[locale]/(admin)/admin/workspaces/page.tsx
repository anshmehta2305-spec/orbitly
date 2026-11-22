'use client';

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Gift,
  Calendar,
  Layers,
  Users,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: 'FREE' | 'PRO' | 'TEAM' | 'AGENCY';
  isComped: boolean;
  compExpiresAt?: string;
  compNote?: string;
  channelsCount: number;
  membersCount: number;
  monthlyPosts: number;
  createdAt: string;
}

export default function AdminWorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceRow | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compTier, setCompTier] = useState<'PRO' | 'TEAM' | 'AGENCY'>('TEAM');
  const [compDurationDays, setCompDurationDays] = useState(90);
  const [compNote, setCompNote] = useState('');

  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([
    {
      id: 'ws_demo_1',
      name: 'Sarah Creatives',
      slug: 'sarah-creatives',
      ownerEmail: 'sarah@example.com',
      plan: 'PRO',
      isComped: false,
      channelsCount: 6,
      membersCount: 2,
      monthlyPosts: 142,
      createdAt: '2026-08-14',
    },
    {
      id: 'ws_demo_2',
      name: 'Acme Growth Labs',
      slug: 'acme-growth',
      ownerEmail: 'alex@growthagency.io',
      plan: 'TEAM',
      isComped: true,
      compExpiresAt: '2027-01-01',
      compNote: 'Beta partnership partner account',
      channelsCount: 22,
      membersCount: 8,
      monthlyPosts: 890,
      createdAt: '2026-09-02',
    },
    {
      id: 'ws_free_3',
      name: 'Independent Podcaster',
      slug: 'indie-pod',
      ownerEmail: 'marcus@podcasters.net',
      plan: 'FREE',
      isComped: false,
      channelsCount: 3,
      membersCount: 1,
      monthlyPosts: 28,
      createdAt: '2026-10-11',
    },
    {
      id: 'ws_agency_4',
      name: 'Omni Media Global',
      slug: 'omni-media',
      ownerEmail: 'contact@omniglobal.com',
      plan: 'AGENCY',
      isComped: false,
      channelsCount: 84,
      membersCount: 36,
      monthlyPosts: 4520,
      createdAt: '2026-07-20',
    },
  ]);

  const handleApplyComp = () => {
    if (!selectedWorkspace) return;
    const expiry = new Date(Date.now() + compDurationDays * 86400000).toISOString().split('T')[0];

    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === selectedWorkspace.id) {
          return {
            ...w,
            plan: compTier,
            isComped: true,
            compExpiresAt: expiry,
            compNote: compNote || 'Granted by SuperAdmin',
          };
        }
        return w;
      })
    );

    toast.success(`Comped ${selectedWorkspace.name} with ${compTier} plan until ${expiry}`);
    setShowCompModal(false);
    setSelectedWorkspace(null);
    setCompNote('');
  };

  const handleRevokeComp = (workspaceId: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === workspaceId) {
          return {
            ...w,
            plan: 'FREE',
            isComped: false,
            compExpiresAt: undefined,
            compNote: undefined,
          };
        }
        return w;
      })
    );
    toast.success('Comp plan revoked. Downgraded to Free.');
  };

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Workspace Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage tenant plans, review usage limits, and grant promotional comp subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {filteredWorkspaces.length} Workspaces
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by workspace, slug, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Workspaces Table */}
      <div className="border border-border rounded-2xl bg-card/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 font-bold text-foreground">
              <th className="p-4">Workspace</th>
              <th className="p-4">Active Plan</th>
              <th className="p-4">Channels</th>
              <th className="p-4">Seats</th>
              <th className="p-4">Monthly Posts</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredWorkspaces.map((ws) => (
              <tr key={ws.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center font-bold text-primary">
                      {ws.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        {ws.name}
                        {ws.isComped && (
                          <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/10">
                            COMPED
                          </Badge>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {ws.slug} &bull; {ws.ownerEmail}
                      </p>
                      {ws.isComped && ws.compExpiresAt && (
                        <p className="text-[10px] text-amber-500/90">
                          Expires: {ws.compExpiresAt} ({ws.compNote})
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={`font-black text-[11px] font-mono ${
                      ws.plan === 'AGENCY'
                        ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                        : ws.plan === 'TEAM'
                        ? 'border-primary/40 text-primary bg-primary/10'
                        : ws.plan === 'PRO'
                        ? 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {ws.plan}
                  </Badge>
                </td>
                <td className="p-4 font-mono">{ws.channelsCount}</td>
                <td className="p-4 font-mono">{ws.membersCount}</td>
                <td className="p-4 font-mono">{ws.monthlyPosts.toLocaleString()}</td>
                <td className="p-4 text-muted-foreground font-mono">{ws.createdAt}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {ws.isComped ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeComp(ws.id)}
                        className="text-[11px] font-bold h-7 hover:border-rose-500 hover:text-rose-500"
                      >
                        Revoke Comp
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWorkspace(ws);
                          setShowCompModal(true);
                        }}
                        className="text-[11px] font-bold h-7 gap-1 hover:border-primary hover:text-primary"
                      >
                        <Gift className="w-3.5 h-3.5 text-primary" /> Comp Plan
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comp Modal */}
      {showCompModal && selectedWorkspace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Override / Comp Plan</h3>
                <p className="text-xs text-muted-foreground">Workspace: {selectedWorkspace.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Target Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PRO', 'TEAM', 'AGENCY'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setCompTier(tier)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        compTier === tier
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={compDurationDays}
                  onChange={(e) => setCompDurationDays(Number(e.target.value))}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Reason / Internal Audit Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creator partner sponsorship, early tester"
                  value={compNote}
                  onChange={(e) => setCompNote(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCompModal(false)}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleApplyComp} className="font-bold">
                Apply Comp Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
