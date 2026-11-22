'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  Zap,
  Repeat,
  Rss,
  Webhook,
  Play,
  Pause,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'webhooks'>('rules');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showDryRunModal, setShowDryRunModal] = useState(false);
  const [showRunsModal, setShowRunsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Automations List State
  const [automations, setAutomations] = useState<any[]>([
    {
      id: 'auto_1',
      name: 'Daily Morning Thought Leadership',
      type: 'RECURRING',
      channels: ['Twitter / X', 'LinkedIn'],
      status: 'ACTIVE',
      schedule: 'Daily at 09:00 UTC',
      template: 'Good morning founders! ☀️ Today is {{day_of_week}}, {{date}}.\n\nFocus on 1 needle-moving objective today.',
      lastRunAt: 'Today, 09:00 UTC',
      nextRunAt: 'Tomorrow, 09:00 UTC',
      postsCreated: 42,
    },
    {
      id: 'auto_2',
      name: 'Agency Blog Evergreen Recycling',
      type: 'EVERGREEN',
      channels: ['LinkedIn', 'Twitter / X'],
      status: 'ACTIVE',
      schedule: 'Every 3 days (14d min gap)',
      template: 'Evergreen best practices from our archives',
      lastRunAt: 'Nov 19, 14:00 UTC',
      nextRunAt: 'Nov 22, 14:00 UTC',
      postsCreated: 18,
    },
    {
      id: 'auto_3',
      name: 'Product Changelog to Social',
      type: 'RSS',
      channels: ['Twitter / X'],
      status: 'ACTIVE',
      schedule: 'Every 60 minutes',
      template: '🚀 New Release: {{title}}\n\n{{url}}\n\n#OrbitlyChangelog',
      lastRunAt: '25m ago',
      nextRunAt: 'in 35m',
      postsCreated: 12,
    },
  ]);

  // Webhook Endpoints State
  const [webhooks, setWebhooks] = useState<any[]>([
    {
      id: 'wh_1',
      name: 'Zapier / Make Inbound Listener',
      token: 'orb_wh_tok_8f9a2b1c4e7d3a0e',
      secret: 'orb_wh_sec_9918273645a1b2c3d4e5f6',
      url: 'http://localhost:4000/public/hooks/orb_wh_tok_8f9a2b1c4e7d3a0e',
      lastUsedAt: '2h ago',
    },
  ]);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState<'RECURRING' | 'EVERGREEN' | 'RSS'>('RECURRING');
  const [wizardName, setWizardName] = useState('My Automation Rule');
  const [wizardTemplate, setWizardTemplate] = useState('Daily insight for {{date}}: Remember to plan once and publish everywhere!');
  const [wizardRssUrl, setWizardRssUrl] = useState('https://news.ycombinator.com/rss');
  const [wizardChannels, setWizardChannels] = useState<string[]>(['Twitter / X', 'LinkedIn']);
  const [wizardFrequency, setWizardFrequency] = useState('DAILY');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePause = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const newStatus = a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          toast.success(`Automation is now ${newStatus.toLowerCase()}`);
          return { ...a, status: newStatus };
        }
        return a;
      }),
    );
  };

  const handleRunNow = (name: string) => {
    toast.success(`Triggered "${name}" execution now!`);
  };

  const handleCreateWebhook = () => {
    const newId = `wh_${Date.now()}`;
    const token = 'orb_wh_tok_' + Math.random().toString(36).substring(2, 12);
    const secret = 'orb_wh_sec_' + Math.random().toString(36).substring(2, 16);
    setWebhooks((prev) => [
      ...prev,
      {
        id: newId,
        name: 'New Webhook Trigger',
        token,
        secret,
        url: `http://localhost:4000/public/hooks/${token}`,
        lastUsedAt: 'Never',
      },
    ]);
    toast.success('Generated new inbound webhook endpoint!');
  };

  const handleCreateAutomation = () => {
    setAutomations((prev) => [
      ...prev,
      {
        id: `auto_${Date.now()}`,
        name: wizardName,
        type: wizardType,
        channels: wizardChannels,
        status: 'ACTIVE',
        schedule: wizardFrequency === 'DAILY' ? 'Daily at 09:00 UTC' : 'Weekly',
        template: wizardTemplate,
        lastRunAt: 'Never',
        nextRunAt: 'Tomorrow, 09:00 UTC',
        postsCreated: 0,
      },
    ]);
    setShowCreateWizard(false);
    toast.success('New automation created and activated!');
  };

  return (
    <AppShell activeNav="automations">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                <Zap className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Automations & Workflows</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Set up recurring cron schedules, evergreen post recycling, RSS triggers, and secure inbound webhooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-secondary rounded-2xl border border-border text-xs font-semibold">
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeTab === 'rules' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Automation Rules
              </button>
              <button
                onClick={() => setActiveTab('webhooks')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeTab === 'webhooks' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Inbound Webhooks
              </button>
            </div>

            {activeTab === 'rules' ? (
              <button
                onClick={() => setShowCreateWizard(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Automation</span>
              </button>
            ) : (
              <button
                onClick={handleCreateWebhook}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Webhook Endpoint</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Rules List */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Automations strictly respect workspace approval settings (require Admin approval if enabled).</span>
              </span>
              <span>3 Active Rules</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {automations.map((a) => {
                const isRecurring = a.type === 'RECURRING';
                const isEvergreen = a.type === 'EVERGREEN';
                const isRss = a.type === 'RSS';

                return (
                  <div
                    key={a.id}
                    className="p-5 rounded-3xl bg-card border border-border space-y-3 hover:border-primary/40 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary shrink-0">
                          {isRecurring && <Clock className="w-5 h-5" />}
                          {isEvergreen && <Repeat className="w-5 h-5" />}
                          {isRss && <Rss className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-foreground">{a.name}</h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                a.status === 'ACTIVE'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {a.status}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-primary font-bold">
                              {a.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>Cadence: {a.schedule}</span>
                            <span>•</span>
                            <span>Target: {a.channels.join(', ')}</span>
                            <span>•</span>
                            <span>Created: {a.postsCreated} posts</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRunNow(a.name)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
                          title="Run immediate execution"
                        >
                          <Play className="w-3 h-3 text-primary fill-primary" />
                          <span>Run Now</span>
                        </button>

                        <button
                          onClick={() => handleTogglePause(a.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          {a.status === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{a.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                        </button>

                        <button
                          onClick={() => setShowRunsModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary text-xs font-semibold"
                        >
                          Logs
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-background/60 rounded-2xl border border-border/50 text-xs text-muted-foreground font-mono">
                      <span className="text-foreground font-bold">Template: </span>
                      {a.template}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Last executed: {a.lastRunAt}</span>
                      <span>Next scheduled run: <strong className="text-foreground">{a.nextRunAt}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Inbound Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-card border border-border space-y-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  <span>Inbound Webhook Triggers</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish or schedule posts programmatically from Make, Zapier, n8n, GitHub Actions, or custom backends using HMAC-SHA256 signatures.
                </p>
              </div>

              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground">{wh.name}</h3>
                      <button
                        onClick={() => toast.success('Signing secret rotated!')}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Rotate Secret</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Endpoint URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={wh.url}
                          className="flex-1 p-2 rounded-xl bg-background border border-border text-xs font-mono"
                        />
                        <button
                          onClick={() => handleCopy(wh.url, `url_${wh.id}`)}
                          className="p-2 rounded-xl border border-border hover:bg-secondary text-xs"
                        >
                          {copiedId === `url_${wh.id}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Signing Secret (HMAC-SHA256)</label>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          type="password"
                          value={wh.secret}
                          className="flex-1 p-2 rounded-xl bg-background border border-border text-xs font-mono"
                        />
                        <button
                          onClick={() => handleCopy(wh.secret, `sec_${wh.id}`)}
                          className="p-2 rounded-xl border border-border hover:bg-secondary text-xs"
                        >
                          {copiedId === `sec_${wh.id}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Snippet Example */}
            <div className="p-5 rounded-3xl bg-card border border-border space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                <span>Example cURL Request</span>
              </h3>
              <pre className="p-4 rounded-2xl bg-background text-[11px] font-mono text-muted-foreground overflow-x-auto border border-border leading-relaxed">
{`curl -X POST https://api.orbitly.io/public/hooks/orb_wh_tok_8f9a2b1c4e7d3a0e \\
  -H "Content-Type: application/json" \\
  -H "X-Orbitly-Timestamp: $(date +%s)" \\
  -H "X-Orbitly-Signature: <computed_hmac_sha256>" \\
  -d '{
    "content": "Excited to launch our product today! https://orbitly.io",
    "channelIds": ["ch_tw_1", "ch_li_2"],
    "scheduledAt": "2026-11-25T14:00:00Z"
  }'`}
              </pre>
            </div>
          </div>
        )}

        {/* Create Wizard Modal */}
        {showCreateWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateWizard(false)} />
            <div className="relative w-full max-w-xl bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base">New Automation Wizard (Step {wizardStep} of 2)</h3>
                <button onClick={() => setShowCreateWizard(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Choose Trigger Type
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'RECURRING', label: 'Recurring', icon: Clock, desc: 'Daily / Weekly post template' },
                      { id: 'EVERGREEN', label: 'Evergreen', icon: Repeat, desc: 'Recycle top posts from pool' },
                      { id: 'RSS', label: 'RSS Feed', icon: Rss, desc: 'Auto-post new blog articles' },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = wizardType === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setWizardType(t.id as any)}
                          className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background hover:bg-secondary text-foreground'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <div className="font-bold text-xs">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Automation Name
                    </label>
                    <input
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  {wizardType === 'RECURRING' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                          Post Template (Supports &#123;&#123;date&#125;&#125;, &#123;&#123;day_of_week&#125;&#125;, &#123;&#123;year&#125;&#125;)
                        </label>
                        <textarea
                          value={wizardTemplate}
                          onChange={(e) => setWizardTemplate(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-xs resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                            Frequency
                          </label>
                          <select
                            value={wizardFrequency}
                            onChange={(e) => setWizardFrequency(e.target.value)}
                            className="w-full p-2 rounded-xl border border-border bg-background text-xs"
                          >
                            <option value="DAILY">Daily at 09:00 UTC</option>
                            <option value="WEEKLY">Weekly on Mondays</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                            Dry Run Preview
                          </label>
                          <button
                            onClick={() => setShowDryRunModal(true)}
                            className="w-full py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview 3 Posts</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {wizardType === 'RSS' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                        RSS / Atom Feed URL (SSRF Protected)
                      </label>
                      <input
                        value={wizardRssUrl}
                        onChange={(e) => setWizardRssUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateAutomation}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                    >
                      Activate Automation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dry Run Modal */}
        {showDryRunModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDryRunModal(false)} />
            <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>Dry Run Preview: Next 3 Posts</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                These preview variants verify placeholder substitution and scheduling times without publishing.
              </p>

              <div className="space-y-3">
                {[
                  { day: 'Tomorrow', text: 'Daily insight for Nov 22, 2026: Remember to plan once and publish everywhere!' },
                  { day: 'In 2 days', text: 'Daily insight for Nov 23, 2026: Remember to plan once and publish everywhere!' },
                  { day: 'In 3 days', text: 'Daily insight for Nov 24, 2026: Remember to plan once and publish everywhere!' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 text-xs space-y-1">
                    <span className="font-bold text-primary">{item.day}</span>
                    <p className="text-foreground">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDryRunModal(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Modal */}
        {showRunsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRunsModal(false)} />
            <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base">Automation Execution Logs</h3>
              <div className="space-y-2 text-xs">
                {[
                  { status: 'SUCCESS', posts: 1, time: 'Today at 09:00:02 UTC' },
                  { status: 'SUCCESS', posts: 1, time: 'Yesterday at 09:00:01 UTC' },
                  { status: 'SUCCESS', posts: 1, time: 'Nov 19 at 09:00:03 UTC' },
                ].map((log, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/40 flex items-center justify-between">
                    <span className="font-bold text-success flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{log.status}</span>
                    </span>
                    <span className="text-muted-foreground">{log.posts} post created</span>
                    <span className="text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowRunsModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
