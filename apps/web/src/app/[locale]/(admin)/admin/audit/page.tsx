'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Shield,
  Eye,
  KeyRound,
  Calendar,
  Filter,
  User,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorType: 'SUPERADMIN' | 'SUPPORT' | 'USER' | 'SYSTEM' | 'IMPERSONATOR';
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
  metadata: Record<string, any>;
}

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'aud_881',
      timestamp: '2026-11-21T15:20:12Z',
      actorType: 'SUPERADMIN',
      actorEmail: 'ops@orbitly.app',
      action: 'WORKSPACE_PLAN_OVERRIDE',
      targetType: 'Workspace',
      targetId: 'ws_demo_2',
      ipAddress: '198.51.100.4',
      metadata: {
        previousPlan: 'PRO',
        newPlan: 'TEAM',
        durationDays: 90,
        note: 'Beta partnership partner account',
      },
    },
    {
      id: 'aud_882',
      timestamp: '2026-11-21T14:48:30Z',
      actorType: 'SUPPORT',
      actorEmail: 'elena@orbitly.app',
      action: 'USER_IMPERSONATION_START',
      targetType: 'User',
      targetId: 'usr_sarah_01',
      ipAddress: '203.0.113.19',
      metadata: {
        reason: 'Investigate approval workflow notification issue',
        ticketId: 'SUP-4921',
      },
    },
    {
      id: 'aud_883',
      timestamp: '2026-11-21T14:15:02Z',
      actorType: 'USER',
      actorEmail: 'sarah@example.com',
      action: 'API_KEY_REVOKED',
      targetType: 'ApiKey',
      targetId: 'key_live_99a',
      ipAddress: '192.0.2.14',
      metadata: {
        prefix: 'orb_live_7a8b...',
        name: 'Production Zapier Integration',
      },
    },
    {
      id: 'aud_884',
      timestamp: '2026-11-21T13:00:00Z',
      actorType: 'SYSTEM',
      actorEmail: 'system@orbitly.app',
      action: 'DUNNING_GRACE_PERIOD_EXPIRED',
      targetType: 'Subscription',
      targetId: 'sub_str_303',
      ipAddress: '127.0.0.1',
      metadata: {
        downgradedTo: 'FREE',
        scheduledPostsRevertedToDraft: 4,
      },
    },
  ]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Immutable Platform Audit Logs</h1>
          <p className="text-xs text-muted-foreground">
            Complete, tamper-evident record of all administrative overrides, user impersonations, and security events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {filteredLogs.length} Events Logged
          </Badge>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by action, actor, or target ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Audit Table */}
      <div className="border border-border rounded-2xl bg-card/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 font-bold text-foreground">
              <th className="p-4">Timestamp (UTC)</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">IP Address</th>
              <th className="p-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                <td className="p-4 font-mono text-muted-foreground">{log.timestamp}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${
                        log.actorType === 'SUPERADMIN'
                          ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                          : log.actorType === 'SUPPORT'
                          ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          : log.actorType === 'SYSTEM'
                          ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {log.actorType}
                    </Badge>
                    <span className="font-semibold text-foreground">{log.actorEmail}</span>
                  </div>
                </td>
                <td className="p-4 font-mono font-bold text-foreground">{log.action}</td>
                <td className="p-4 font-mono text-muted-foreground">
                  {log.targetType}:{log.targetId}
                </td>
                <td className="p-4 font-mono text-muted-foreground">{log.ipAddress}</td>
                <td className="p-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEntry(log)}
                    className="text-[11px] font-bold h-7 gap-1"
                  >
                    <Eye className="w-3 h-3" /> View JSON
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Metadata Viewer Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground font-mono">{selectedEntry.action}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">ID: {selectedEntry.id}</p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedEntry.actorType}
              </Badge>
            </div>

            <pre className="bg-black/80 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed border border-border">
              {JSON.stringify(
                {
                  id: selectedEntry.id,
                  timestamp: selectedEntry.timestamp,
                  actor: selectedEntry.actorEmail,
                  actorType: selectedEntry.actorType,
                  action: selectedEntry.action,
                  target: `${selectedEntry.targetType}:${selectedEntry.targetId}`,
                  ip: selectedEntry.ipAddress,
                  metadata: selectedEntry.metadata,
                },
                null,
                2
              )}
            </pre>

            <div className="flex justify-end pt-2">
              <Button variant="default" size="sm" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
