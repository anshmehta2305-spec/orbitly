'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MousePointer,
  Download,
  Calendar,
  Share2,
  Clock,
  Flame,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Send,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [postSort, setPostSort] = useState<'best' | 'worst' | 'impressions'>('best');
  const [showScheduleReportModal, setShowScheduleReportModal] = useState(false);

  // Mock Overview Data
  const kpis = {
    followers: { value: '14,820', delta: 18.4, isUp: true },
    impressions: { value: '382,400', delta: 24.2, isUp: true },
    engagements: { value: '28,950', delta: 12.1, isUp: true },
    clicks: { value: '6,420', delta: -3.5, isUp: false },
    avgRate: '7.57%',
  };

  // Connected Channels Stats
  const channelStats = [
    { name: 'Sarah | Design & SaaS', platform: 'Twitter / X', followers: 8420, impressions: 210000, engRate: '6.8%', posts: 24 },
    { name: 'Sarah Jenkins', platform: 'LinkedIn', followers: 4210, impressions: 124000, engRate: '8.9%', posts: 18 },
    { name: '@sarah.designs', platform: 'Instagram', followers: 2190, impressions: 48400, engRate: '7.2%', posts: 12 },
  ];

  // Top / Worst Posts
  const posts = [
    {
      id: 'p1',
      platform: 'LinkedIn',
      content: 'The biggest bottleneck for scaling modern brands is fragmented distribution. Here is what we learned auditing 50+ agencies...',
      date: 'Nov 18, 2026',
      impressions: 42100,
      likes: 890,
      comments: 142,
      shares: 64,
      rate: '9.2%',
    },
    {
      id: 'p2',
      platform: 'Twitter',
      content: 'Most creators waste 10+ hours a week juggling 6 different tabs. Centralize everything in 1 calendar: https://orbitly.io',
      date: 'Nov 15, 2026',
      impressions: 34200,
      likes: 620,
      comments: 88,
      shares: 110,
      rate: '7.4%',
    },
    {
      id: 'p3',
      platform: 'Instagram',
      content: 'Batch your entire week of visual social media posts in under 20 minutes ✨ Save this post for your content batching day!',
      date: 'Nov 12, 2026',
      impressions: 18900,
      likes: 940,
      comments: 52,
      shares: 45,
      rate: '8.1%',
    },
    {
      id: 'p4',
      platform: 'Twitter',
      content: 'Testing new feature deployment... check out orbitly.io',
      date: 'Nov 02, 2026',
      impressions: 2100,
      likes: 18,
      comments: 2,
      shares: 1,
      rate: '1.2%',
    },
  ];

  const sortedPosts = [...posts].sort((a, b) => {
    if (postSort === 'best') return parseFloat(b.rate) - parseFloat(a.rate);
    if (postSort === 'worst') return parseFloat(a.rate) - parseFloat(b.rate);
    return b.impressions - a.impressions;
  });

  const handleExportCsv = async () => {
    toast.success('Downloading analytics CSV report...');
    try {
      const res = await fetch(`http://localhost:4000/analytics/export?range=${dateRange}`, {
        headers: { 'x-workspace-id': 'ws_demo_1' },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orbitly_analytics_${dateRange}.csv`;
        a.click();
      } else {
        throw new Error();
      }
    } catch {
      // Fallback CSV download
      const fakeCsv = '\uFEFFPlatform,Followers,Impressions,Engagements\nTwitter,8420,210000,14200\nLinkedIn,4210,124000,11000\nInstagram,2190,48400,3400';
      const blob = new Blob([fakeCsv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbitly_analytics_${dateRange}.csv`;
      a.click();
      toast.success('Analytics CSV report exported successfully!');
    }
  };

  return (
    <AppShell activeNav="analytics">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics & Performance</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cross-platform growth metrics, audience engagements, and publication intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center p-1 bg-secondary rounded-2xl border border-border text-xs font-semibold">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-xl uppercase transition-all ${
                    dateRange === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Compare Toggle */}
            <button
              onClick={() => setComparePrevious(!comparePrevious)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                comparePrevious
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-muted-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Compare to Prior Period</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Schedule Email Report */}
            <button
              onClick={() => setShowScheduleReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Schedule Email</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Followers', value: kpis.followers.value, delta: kpis.followers.delta, isUp: kpis.followers.isUp, icon: Users },
            { label: 'Impressions', value: kpis.impressions.value, delta: kpis.impressions.delta, isUp: kpis.impressions.isUp, icon: Eye },
            { label: 'Engagements', value: kpis.engagements.value, delta: kpis.engagements.delta, isUp: kpis.engagements.isUp, icon: Heart },
            { label: 'Link Clicks', value: kpis.clicks.value, delta: kpis.clicks.delta, isUp: kpis.clicks.isUp, icon: MousePointer },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-foreground font-mono">{kpi.value}</span>
                  {comparePrevious && (
                    <div className={`flex items-center gap-0.5 text-xs font-bold ${kpi.isUp ? 'text-success' : 'text-destructive'}`}>
                      {kpi.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{kpi.delta > 0 ? `+${kpi.delta}%` : `${kpi.delta}%`}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                  <span>Avg Engagement Rate:</span>
                  <span className="font-bold text-foreground font-mono">{kpis.avgRate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Trend Chart */}
          <div className="lg:col-span-8 p-5 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Impressions & Reach Growth</h2>
                <p className="text-xs text-muted-foreground">Daily distribution volume across all published variants</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Impressions</span>
                <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Engagements</span>
              </div>
            </div>

            {/* SVG Visual Area Chart */}
            <div className="h-64 w-full pt-4">
              <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="orbitlyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />

                {/* Area fill */}
                <path
                  d="M 0,140 Q 60,110 120,125 T 240,70 T 360,50 T 500,20 L 500,160 L 0,160 Z"
                  fill="url(#orbitlyAreaGrad)"
                />
                {/* Smooth Curve */}
                <path
                  d="M 0,140 Q 60,110 120,125 T 240,70 T 360,50 T 500,20"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Highlight data circles */}
                <circle cx="120" cy="125" r="4" fill="hsl(var(--primary))" />
                <circle cx="240" cy="70" r="4" fill="hsl(var(--primary))" />
                <circle cx="360" cy="50" r="4" fill="hsl(var(--primary))" />
                <circle cx="500" cy="20" r="5" fill="hsl(var(--primary))" />
              </svg>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                <span>Nov 01</span>
                <span>Nov 08</span>
                <span>Nov 15</span>
                <span>Nov 22</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Connected Channels Share */}
          <div className="lg:col-span-4 p-5 rounded-3xl bg-card border border-border space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold">Platform Distribution</h2>
              <p className="text-xs text-muted-foreground">Follower share by connected channel</p>
            </div>

            <div className="space-y-3 py-2">
              {channelStats.map((ch, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{ch.platform}</span>
                    <span className="font-mono text-muted-foreground">{ch.followers.toLocaleString()} followers</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(ch.followers / 15000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-secondary/50 rounded-2xl text-xs space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-accent" />
                <span>Growth Highlight</span>
              </span>
              <p className="text-muted-foreground">LinkedIn engagement increased by +28% this month due to early morning posting.</p>
            </div>
          </div>
        </div>

        {/* 7x24 Best Time to Post Heatmap */}
        <div className="p-5 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Best Time to Post Intelligence (7x24 Heatmap)</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Engagement index calculated from 140+ published posts across your channels.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Low</span>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded bg-primary/10" />
                <div className="w-3.5 h-3.5 rounded bg-primary/30" />
                <div className="w-3.5 h-3.5 rounded bg-primary/60" />
                <div className="w-3.5 h-3.5 rounded bg-primary" />
              </div>
              <span className="text-muted-foreground">Peak</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px] space-y-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dIdx) => (
                <div key={day} className="flex items-center gap-1">
                  <span className="w-8 text-[11px] font-bold text-muted-foreground">{day}</span>
                  <div className="flex-1 grid grid-cols-24 gap-1">
                    {Array.from({ length: 24 }).map((_, h) => {
                      // Intensities based on realistic best hours
                      let opacity = 'bg-primary/10';
                      if (dIdx >= 1 && dIdx <= 5) {
                        if (h >= 8 && h <= 10) opacity = 'bg-primary';
                        else if (h >= 12 && h <= 14) opacity = 'bg-primary/70';
                        else if (h >= 17 && h <= 19) opacity = 'bg-primary/80';
                        else if (h >= 6 && h <= 21) opacity = 'bg-primary/30';
                      } else {
                        if (h >= 11 && h <= 15) opacity = 'bg-primary/60';
                      }
                      return (
                        <div
                          key={h}
                          className={`h-5 rounded-md ${opacity} transition-transform hover:scale-125 cursor-pointer`}
                          title={`${day} at ${h}:00 - High Engagement`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pl-8 pt-1 text-[10px] text-muted-foreground">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-foreground">Top Recommended Windows:</span>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">Tuesday 09:00</span>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">Wednesday 13:00</span>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">Thursday 18:00</span>
          </div>
        </div>

        {/* Sortable Post Performance Table */}
        <div className="p-5 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">Post Performance & Metrics</h2>
              <p className="text-xs text-muted-foreground">Deep dive into published content engagement, reach, and virality.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <select
                value={postSort}
                onChange={(e) => setPostSort(e.target.value as any)}
                className="p-1.5 rounded-xl border border-border bg-background text-xs font-semibold"
              >
                <option value="best">Highest Engagement Rate</option>
                <option value="worst">Lowest Engagement Rate</option>
                <option value="impressions">Most Impressions</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Post Content</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Impressions</th>
                  <th className="p-3">Likes</th>
                  <th className="p-3">Comments</th>
                  <th className="p-3">Shares</th>
                  <th className="p-3 font-bold text-foreground">Eng. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 max-w-xs truncate font-medium text-foreground">{post.content}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {post.platform}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{post.date}</td>
                    <td className="p-3 font-mono font-semibold">{post.impressions.toLocaleString()}</td>
                    <td className="p-3 font-mono text-muted-foreground">{post.likes}</td>
                    <td className="p-3 font-mono text-muted-foreground">{post.comments}</td>
                    <td className="p-3 font-mono text-muted-foreground">{post.shares}</td>
                    <td className="p-3 font-mono font-bold text-primary">{post.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Report Modal */}
        {showScheduleReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScheduleReportModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>Schedule Executive Email Report</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Receive an automated PDF and metric executive summary report delivered to your team inbox.
              </p>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Frequency
                </label>
                <select className="w-full p-2.5 rounded-xl border border-border bg-background text-xs">
                  <option>Every Monday at 08:00 AM</option>
                  <option>1st of Every Month</option>
                  <option>Daily Digest</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Recipient Emails
                </label>
                <input
                  defaultValue="sarah@agency.com, team@orbitly.io"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowScheduleReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Automated report schedule saved!');
                    setShowScheduleReportModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
