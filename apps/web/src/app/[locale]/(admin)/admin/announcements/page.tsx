'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  AlertTriangle,
  Info,
  AlertCircle,
  Calendar,
  Layers,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  targetPlans: string[];
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([
    {
      id: 'ann_1',
      title: 'Scheduled Database Maintenance on Dec 1st',
      body: 'Orbitly database upgrades will occur on Sunday Dec 1st at 02:00-02:30 UTC. Scheduled posts will publish normally without interruption.',
      type: 'INFO',
      targetPlans: ['FREE', 'PRO', 'TEAM', 'AGENCY'],
      isActive: true,
      startsAt: '2026-11-20',
      endsAt: '2026-12-01',
    },
    {
      id: 'ann_2',
      title: 'Meta Graph API Degradation',
      body: 'Meta is experiencing transient delays with Instagram carousel verification. We are automatically retrying failed jobs.',
      type: 'WARNING',
      targetPlans: ['PRO', 'TEAM', 'AGENCY'],
      isActive: true,
      startsAt: '2026-11-21',
      endsAt: '2026-11-22',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');

  const handleToggle = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.isActive;
          toast.success(`Announcement is now ${next ? 'ACTIVE' : 'INACTIVE'}`);
          return { ...a, isActive: next };
        }
        return a;
      })
    );
  };

  const handleCreateAnnouncement = () => {
    if (!newTitle || !newBody) return;
    const newAnn: AnnouncementRow = {
      id: `ann_${Date.now()}`,
      title: newTitle,
      body: newBody,
      type: newType,
      targetPlans: ['FREE', 'PRO', 'TEAM', 'AGENCY'],
      isActive: true,
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };

    setAnnouncements([newAnn, ...announcements]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewBody('');
    toast.success('Broadcast announcement scheduled and published');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Platform Announcements</h1>
          <p className="text-xs text-muted-foreground">
            Broadcast emergency banners, maintenance schedules, and changelog updates across tenant workspaces.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="gap-2 font-bold"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-6 rounded-2xl border bg-card/60 space-y-4 shadow-sm transition-all ${
              ann.isActive ? 'border-border' : 'border-border/40 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] ${
                    ann.type === 'CRITICAL'
                      ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                      : ann.type === 'WARNING'
                      ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                      : 'border-sky-500/30 text-sky-400 bg-sky-500/10'
                  }`}
                >
                  {ann.type}
                </Badge>
                <h3 className="text-sm font-bold text-foreground">{ann.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground font-mono">
                  {ann.startsAt} &rarr; {ann.endsAt}
                </span>
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] ${
                    ann.isActive
                      ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {ann.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{ann.body}</p>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Target:</span>
                {ann.targetPlans.map((pl) => (
                  <Badge key={pl} variant="outline" className="text-[9px] font-mono">
                    {pl}
                  </Badge>
                ))}
              </div>

              <Button
                variant={ann.isActive ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleToggle(ann.id)}
                className="text-[11px] font-bold h-7"
              >
                {ann.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Create Announcement</h3>
                <p className="text-xs text-muted-foreground">Broadcast an alert to all tenant dashboards</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Severity Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['INFO', 'WARNING', 'CRITICAL'] as const).map((tp) => (
                    <button
                      key={tp}
                      onClick={() => setNewType(tp)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        newType === tp
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Network Maintenance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  placeholder="Details of the announcement..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateAnnouncement}
                className="font-bold"
              >
                Broadcast Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
