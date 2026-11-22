'use client';

import React, { useState } from 'react';
import {
  Radio,
  AlertTriangle,
  CheckCircle2,
  PowerOff,
  RefreshCw,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProviderStatus {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DISABLED';
  latencyMs: number;
  errorRate24h: string;
  killSwitchActive: boolean;
  notes: string;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([
    {
      id: 'x',
      name: 'X (formerly Twitter)',
      status: 'HEALTHY',
      latencyMs: 380,
      errorRate24h: '0.12%',
      killSwitchActive: false,
      notes: 'API v2 OAuth 2.0 operational',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      status: 'HEALTHY',
      latencyMs: 420,
      errorRate24h: '0.08%',
      killSwitchActive: false,
      notes: 'Community Management API operational',
    },
    {
      id: 'instagram',
      name: 'Instagram (Graph API)',
      status: 'DEGRADED',
      latencyMs: 910,
      errorRate24h: '1.45%',
      killSwitchActive: false,
      notes: 'Meta reported minor intermittent delay on reel processing',
    },
    {
      id: 'facebook',
      name: 'Facebook Pages',
      status: 'HEALTHY',
      latencyMs: 510,
      errorRate24h: '0.05%',
      killSwitchActive: false,
      notes: 'Graph API v20.0 operational',
    },
    {
      id: 'threads',
      name: 'Threads',
      status: 'HEALTHY',
      latencyMs: 480,
      errorRate24h: '0.10%',
      killSwitchActive: false,
      notes: 'Threads Publishing API operational',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      status: 'HEALTHY',
      latencyMs: 620,
      errorRate24h: '0.25%',
      killSwitchActive: false,
      notes: 'Direct Post API operational',
    },
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      status: 'HEALTHY',
      latencyMs: 740,
      errorRate24h: '0.04%',
      killSwitchActive: false,
      notes: 'YouTube Data API v3 operational',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      status: 'HEALTHY',
      latencyMs: 390,
      errorRate24h: '0.09%',
      killSwitchActive: false,
      notes: 'v5 Pins API operational',
    },
    {
      id: 'bluesky',
      name: 'Bluesky (AT Protocol)',
      status: 'HEALTHY',
      latencyMs: 220,
      errorRate24h: '0.01%',
      killSwitchActive: false,
      notes: 'AT Protocol com.atproto.repo operational',
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      status: 'HEALTHY',
      latencyMs: 310,
      errorRate24h: '0.02%',
      killSwitchActive: false,
      notes: 'Decentralized instances federation normal',
    },
    {
      id: 'telegram',
      name: 'Telegram Channels',
      status: 'HEALTHY',
      latencyMs: 190,
      errorRate24h: '0.00%',
      killSwitchActive: false,
      notes: 'Bot API v7.0 operational',
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      status: 'HEALTHY',
      latencyMs: 250,
      errorRate24h: '0.30%',
      killSwitchActive: false,
      notes: 'Outbound HTTP dispatch normal',
    },
  ]);

  const handleToggleKillSwitch = (providerId: string, current: boolean) => {
    const nextState = !current;
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === providerId) {
          return {
            ...p,
            killSwitchActive: nextState,
            status: nextState ? 'DISABLED' : 'HEALTHY',
          };
        }
        return p;
      })
    );

    if (nextState) {
      toast.error(`EMERGENCY KILL SWITCH ACTIVATED for ${providerId.toUpperCase()}. Publishing is halted!`);
    } else {
      toast.success(`Kill switch deactivated for ${providerId.toUpperCase()}. Normal operation resumed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Provider Health & Emergency Kill Switches</h1>
          <p className="text-xs text-muted-foreground">
            Monitor API latencies and upstream error rates. Use emergency kill-switches to instantly halt publishing if an upstream network fails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/30">
            12 Networks Active
          </Badge>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border bg-card/60 space-y-4 shadow-sm transition-all ${
              p.killSwitchActive
                ? 'border-rose-500/50 bg-rose-500/5'
                : p.status === 'DEGRADED'
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    p.killSwitchActive
                      ? 'bg-rose-500/20 text-rose-500'
                      : p.status === 'DEGRADED'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.id}</p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`font-mono text-[9px] ${
                  p.killSwitchActive
                    ? 'border-rose-500/30 text-rose-500 bg-rose-500/10'
                    : p.status === 'DEGRADED'
                    ? 'border-amber-500/30 text-amber-500 bg-amber-500/10'
                    : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                }`}
              >
                {p.killSwitchActive ? 'KILLED' : p.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">Latency</span>
                <span className="font-mono font-bold text-foreground">{p.latencyMs}ms</span>
              </div>
              <div className="p-2 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground block">24h Error Rate</span>
                <span
                  className={`font-mono font-bold ${
                    parseFloat(p.errorRate24h) > 1.0 ? 'text-amber-500' : 'text-foreground'
                  }`}
                >
                  {p.errorRate24h}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">{p.notes}</p>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Emergency Stop:</span>
              <Button
                variant={p.killSwitchActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleToggleKillSwitch(p.id, p.killSwitchActive)}
                className={`text-[11px] font-bold h-7 gap-1.5 ${
                  p.killSwitchActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'hover:border-rose-500 hover:text-rose-500'
                }`}
              >
                <PowerOff className="w-3 h-3" />
                {p.killSwitchActive ? 'Resume Provider' : 'Halt Provider'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
