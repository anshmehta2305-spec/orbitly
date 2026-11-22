'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Share2,
  Calendar,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminFunnelPage() {
  const [funnelData] = useState({
    totalSignups: 1420,
    stages: [
      { id: 'signup', label: '1. User Signup', count: 1420, rate: '100%', dropOff: '0%' },
      { id: 'verified', label: '2. Email Verified', count: 1240, rate: '87.3%', dropOff: '-12.7%' },
      { id: 'channel_connected', label: '3. Channel Connected', count: 980, rate: '69.0%', dropOff: '-18.3%' },
      { id: 'first_post_scheduled', label: '4. First Post Scheduled (<10m)', count: 790, rate: '55.6%', dropOff: '-13.4%' },
      { id: 'first_post_published', label: '5. First Post Published', count: 730, rate: '51.4%', dropOff: '-4.2%' },
      { id: 'upgrade', label: '6. Paid Plan Upgrade', count: 112, rate: '7.9%', dropOff: '-43.5%' },
    ],
    abVariants: {
      variantA: {
        name: 'Variant A: Guided First-Post Flow (Sample Draft Pre-filled)',
        users: 710,
        scheduledIn10m: 442,
        conversionRate: '62.3%',
        winner: true,
      },
      variantB: {
        name: 'Variant B: Exploratory Checklist Widget',
        users: 710,
        scheduledIn10m: 348,
        conversionRate: '49.0%',
        winner: false,
      },
    },
    timeToScheduleDistribution: [
      { label: '< 5 Minutes', percent: '42%' },
      { label: '5 - 10 Minutes', percent: '36%' },
      { label: '10 - 30 Minutes', percent: '14%' },
      { label: '> 30 Minutes', percent: '8%' },
    ],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Activation & Funnel Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Monitor real-time signup activation velocity, drop-off milestones, and onboarding A/B test variant performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-mono text-xs">
            10-Minute Activation Goal: 55.6%
          </Badge>
        </div>
      </div>

      {/* A/B Test Variant Performance Winner Card */}
      <div className="p-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Active A/B Test: Onboarding Flow Optimization
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                Flag: <code className="text-primary font-bold">onboarding-checklist-v2</code> (50/50 Split)
              </p>
            </div>
          </div>

          <Badge variant="default" className="bg-emerald-600 text-white font-bold gap-1 self-start sm:self-auto">
            <Award className="w-3.5 h-3.5" /> Variant A Outperforming (+13.3%)
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-primary/40 bg-card/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {funnelData.abVariants.variantA.name}
              </span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                WINNER
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {funnelData.abVariants.variantA.conversionRate}
              </span>
              <span className="text-xs text-muted-foreground">
                ({funnelData.abVariants.variantA.scheduledIn10m} / {funnelData.abVariants.variantA.users} users)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pre-filled launch copy and recommended 1-click providers drives highest activation speed.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {funnelData.abVariants.variantB.name}
              </span>
              <Badge variant="outline" className="text-muted-foreground text-[10px] font-mono">
                CONTROL
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-foreground">
                {funnelData.abVariants.variantB.conversionRate}
              </span>
              <span className="text-xs text-muted-foreground">
                ({funnelData.abVariants.variantB.scheduledIn10m} / {funnelData.abVariants.variantB.users} users)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Standard dashboard checklist widget with exploratory multi-step cards.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Funnel Steps */}
      <div className="p-6 rounded-3xl border border-border bg-card/60 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Activation Funnel Conversion Stages</h2>
        <div className="space-y-3">
          {funnelData.stages.map((stage, idx) => {
            const widthPercent = Math.max(12, Math.round((stage.count / funnelData.totalSignups) * 100));
            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{stage.label}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-muted-foreground font-medium">
                      {stage.count.toLocaleString()} users
                    </span>
                    <span className="text-primary font-bold">{stage.rate}</span>
                    {idx > 0 && (
                      <span className="text-rose-400 text-[10px]">{stage.dropOff}</span>
                    )}
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time-to-Schedule Distribution */}
      <div className="p-6 rounded-3xl border border-border bg-card/60 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Time to First Post Scheduled (Velocity)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {funnelData.timeToScheduleDistribution.map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-1">
              <span className="text-xs text-muted-foreground block">{item.label}</span>
              <span className="text-xl font-black font-mono text-primary">{item.percent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
