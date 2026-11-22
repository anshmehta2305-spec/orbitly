'use client';

import React, { useState } from 'react';
import {
  Flag,
  Plus,
  Sliders,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FeatureFlagRow {
  id: string;
  key: string;
  description: string;
  isEnabled: boolean;
  percentage: number;
  workspaces: string[];
  updatedAt: string;
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([
    {
      id: 'flg_1',
      key: 'ai-v2-claude-3-5-sonnet',
      description: 'Enables next-generation multi-stage prompt generation via Anthropic Claude 3.5 Sonnet',
      isEnabled: true,
      percentage: 100,
      workspaces: [],
      updatedAt: '2 days ago',
    },
    {
      id: 'flg_2',
      key: 'public-api-v1-beta',
      description: 'Enables developer REST API key generation and outbound webhooks',
      isEnabled: true,
      percentage: 100,
      workspaces: ['ws_demo_1', 'ws_demo_2'],
      updatedAt: 'Today',
    },
    {
      id: 'flg_3',
      key: 'tiktok-direct-video-carousel',
      description: 'Experimental multi-image photo mode publishing for TikTok API',
      isEnabled: false,
      percentage: 20,
      workspaces: ['ws_agency_4'],
      updatedAt: '5 days ago',
    },
    {
      id: 'flg_4',
      key: 'razorpay-india-billing',
      description: 'Enables UPI and Indian Rupee checkout integration via Razorpay',
      isEnabled: true,
      percentage: 100,
      workspaces: [],
      updatedAt: '1 week ago',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPercentage, setNewPercentage] = useState(100);

  const handleToggle = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const next = !f.isEnabled;
          toast.success(`Flag "${f.key}" is now ${next ? 'ENABLED' : 'DISABLED'}`);
          return { ...f, isEnabled: next, updatedAt: 'Just now' };
        }
        return f;
      })
    );
  };

  const handleCreateFlag = () => {
    if (!newKey) return;
    const newFlag: FeatureFlagRow = {
      id: `flg_${Date.now()}`,
      key: newKey.trim().toLowerCase().replace(/\s+/g, '-'),
      description: newDesc,
      isEnabled: true,
      percentage: newPercentage,
      workspaces: [],
      updatedAt: 'Just now',
    };
    setFlags([newFlag, ...flags]);
    setShowCreateModal(false);
    setNewKey('');
    setNewDesc('');
    toast.success(`Created feature flag ${newFlag.key}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Feature Flags & Remote Config</h1>
          <p className="text-xs text-muted-foreground">
            Control progressive rollouts, dark releases, and selective enterprise tenant feature gating.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="gap-2 font-bold"
        >
          <Plus className="w-4 h-4" /> New Feature Flag
        </Button>
      </div>

      {/* Flags List */}
      <div className="border border-border rounded-2xl bg-card/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 font-bold text-foreground">
              <th className="p-4">Key & Description</th>
              <th className="p-4">State</th>
              <th className="p-4">Rollout %</th>
              <th className="p-4">Tenant Scope</th>
              <th className="p-4">Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 max-w-md">
                  <p className="font-bold font-mono text-foreground text-xs">{flag.key}</p>
                  <p className="text-[11px] text-muted-foreground">{flag.description}</p>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] ${
                      flag.isEnabled
                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {flag.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </td>
                <td className="p-4 font-mono font-bold">{flag.percentage}%</td>
                <td className="p-4">
                  {flag.workspaces.length > 0 ? (
                    <span className="font-mono text-purple-400">
                      {flag.workspaces.length} workspaces
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Global</span>
                  )}
                </td>
                <td className="p-4 text-muted-foreground font-mono">{flag.updatedAt}</td>
                <td className="p-4 text-right">
                  <Button
                    variant={flag.isEnabled ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggle(flag.id)}
                    className="text-[11px] font-bold h-7"
                  >
                    {flag.isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Create Feature Flag</h3>
                <p className="text-xs text-muted-foreground">Add a new runtime dynamic switch</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Flag Key (kebab-case)
                </label>
                <input
                  type="text"
                  placeholder="e.g. smart-hashtag-clustering"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this flag..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Rollout Percentage ({newPercentage}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleCreateFlag} className="font-bold">
                Save Flag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
