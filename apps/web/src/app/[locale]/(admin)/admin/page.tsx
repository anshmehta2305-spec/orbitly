'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DollarSign,
  Users,
  CreditCard,
  Layers,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminOverviewPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const kpis = [
    {
      title: 'Monthly Recurring Revenue (MRR)',
      value: '$48,250',
      change: '+14.2% from last month',
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Active Paid Subscriptions',
      value: '1,420',
      change: '1,120 Pro, 240 Team, 60 Agency',
      icon: CreditCard,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Total Registered Users',
      value: '18,940',
      change: '+342 new in past 24h',
      icon: Users,
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
    },
    {
      title: 'BullMQ Queue Depth',
      value: '24 jobs',
      change: '18 waiting, 6 active, 0 stuck',
      icon: Layers,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: '24h Publishing Error Rate',
      value: '0.18%',
      change: '14 fails / 7,820 posts',
      icon: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Active Platform Providers',
      value: '12 / 12',
      change: 'All networks operating normally',
      icon: Server,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  const recentIncidents = [
    {
      id: 'inc_1',
      service: 'Instagram Graph API',
      status: 'RESOLVED',
      time: '2 hours ago',
      desc: 'Meta rate-limit spike affected 8 carousel uploads. Automatic exponential backoff succeeded.',
    },
    {
      id: 'inc_2',
      service: 'Stripe Webhooks',
      status: 'MONITORING',
      time: '6 hours ago',
      desc: 'Slight latency increase (450ms) on customer.subscription.updated dispatch. All events processed idempotently.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Platform Operations Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time multi-tenant health, revenue metrics, queue statuses, and quick system overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1.5 px-3 py-1 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl border border-border bg-card/60 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{kpi.value}</div>
              <p className="text-[11px] font-medium text-muted-foreground">{kpi.change}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Quick Actions & System Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-border bg-card/60 space-y-4">
          <h2 className="text-base font-bold text-foreground">Operational Shortcuts</h2>
          <div className="space-y-2">
            <Link
              href={`/${locale}/admin/users`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors text-xs font-bold"
            >
              <span>User Search & Impersonation</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href={`/${locale}/admin/workspaces`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors text-xs font-bold"
            >
              <span>Comp / Override Workspace Plan</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href={`/${locale}/admin/providers`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors text-xs font-bold"
            >
              <span>Emergency Provider Kill Switches</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href={`/${locale}/admin/queues`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors text-xs font-bold"
            >
              <span>Retry Failed Publishing Jobs</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Live Service Logs / Incidents */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Recent Service Telemetry</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              Live Monitor
            </Badge>
          </div>
          <div className="space-y-3">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{inc.service}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        inc.status === 'RESOLVED'
                          ? 'text-emerald-500 border-emerald-500/20'
                          : 'text-amber-500 border-amber-500/20'
                      }`}
                    >
                      {inc.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{inc.time}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{inc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
