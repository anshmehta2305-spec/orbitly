'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  Code,
  Key,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_KEY_SCOPES } from '@orbitly/shared';

export default function DeveloperSettingsPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showKeyCreatedModal, setShowKeyCreatedModal] = useState(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Key Form State
  const [keyName, setKeyName] = useState('Backend Publishing Service');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['posts:read', 'posts:write', 'channels:read']);
  const [ipAllowlistStr, setIpAllowlistStr] = useState('');
  const [newlyCreatedRawKey, setNewlyCreatedRawKey] = useState('');

  // Existing keys list
  const [apiKeys, setApiKeys] = useState<any[]>([
    {
      id: 'key_1',
      name: 'Zapier Publishing Sync',
      keyPrefix: 'orb_live_a1b2c3d4',
      scopes: ['posts:read', 'posts:write', 'channels:read'],
      lastUsedAt: '12m ago',
      expiresAt: 'In 1 year',
      revokedAt: null,
    },
    {
      id: 'key_2',
      name: 'Analytics Dashboard Scraper',
      keyPrefix: 'orb_live_9e8d7c6b',
      scopes: ['analytics:read'],
      lastUsedAt: 'Yesterday',
      expiresAt: 'Never',
      revokedAt: null,
    },
  ]);

  // Outbound Webhooks List
  const [outboundWebhooks, setOutboundWebhooks] = useState<any[]>([
    {
      id: 'wh_1',
      url: 'https://api.mybrand.com/webhooks/orbitly',
      events: ['post.published', 'post.failed'],
      status: 'ACTIVE',
      failureCount: 0,
      lastDeliveryAt: '45m ago',
      secret: 'whsec_e4b1c9...2a',
    },
  ]);

  const [webhookUrl, setWebhookUrl] = useState('https://agency-hub.com/api/orbitly-listener');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['post.published', 'post.failed', 'post.approved']);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = () => {
    const raw = 'orb_live_' + Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const prefix = raw.slice(0, 16);

    const newKey = {
      id: `key_${Date.now()}`,
      name: keyName,
      keyPrefix: prefix,
      scopes: selectedScopes,
      lastUsedAt: 'Never',
      expiresAt: 'In 1 year',
      revokedAt: null,
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewlyCreatedRawKey(raw);
    setShowCreateKeyModal(false);
    setShowKeyCreatedModal(true);
    toast.success('API Key generated successfully!');
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)),
    );
    toast.success('API key revoked immediately.');
  };

  const handleCreateWebhook = () => {
    setOutboundWebhooks((prev) => [
      ...prev,
      {
        id: `wh_${Date.now()}`,
        url: webhookUrl,
        events: webhookEvents,
        status: 'ACTIVE',
        failureCount: 0,
        lastDeliveryAt: 'Never',
        secret: 'whsec_' + Math.random().toString(36).substring(2, 16),
      },
    ]);
    setShowCreateWebhookModal(false);
    toast.success('Outbound webhook registered successfully!');
  };

  return (
    <AppShell activeNav="developers">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                <Code className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Developer Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage scoped API keys, OpenAPI documentation, and outbound HMAC-SHA256 webhook subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/en/docs/api"
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
            >
              <span>API Reference Docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>

            {activeTab === 'keys' ? (
              <button
                onClick={() => setShowCreateKeyModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create API Key</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCreateWebhookModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Webhook</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'keys' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'webhooks' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Outbound Webhooks</span>
          </button>
        </div>

        {/* Tab 1: API Keys */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Active API Keys</h3>
                  <p className="text-xs text-muted-foreground">Authenticate requests to the Orbitly Public REST API v1 or MCP Server.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3">Key Name</th>
                      <th className="p-3">Prefix / Identifier</th>
                      <th className="p-3">Scopes</th>
                      <th className="p-3">Last Used</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{k.name}</td>
                        <td className="p-3 font-mono text-muted-foreground">{k.keyPrefix}...</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{k.lastUsedAt}</td>
                        <td className="p-3">
                          {k.revokedAt ? (
                            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                              Revoked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {!k.revokedAt && (
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              className="text-destructive hover:underline font-semibold"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Outbound Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Outbound Webhooks</h3>
                  <p className="text-xs text-muted-foreground">
                    Receive signed event notifications whenever posts are published, scheduled, approved, or when channels require re-authorization.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {outboundWebhooks.map((wh) => (
                  <div key={wh.id} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">{wh.url}</span>
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
                          {wh.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDeliveriesModal(true)}
                          className="px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-xs"
                        >
                          Delivery Logs
                        </button>
                        <button
                          onClick={() => toast.success('Webhook deleted')}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground">Subscribed Events:</span>
                      {wh.events.map((e: string) => (
                        <span key={e} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
                          {e}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                      <span>Signing Secret: <code className="font-mono">{wh.secret}</code></span>
                      <span>Last Delivery: {wh.lastDeliveryAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create API Key Modal */}
        {showCreateKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateKeyModal(false)} />
            <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <span>Create New API Key</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Key Name
                </label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Zapier"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Key Scopes & Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {API_KEY_SCOPES.map((scope) => {
                    const isSelected = selectedScopes.includes(scope);
                    return (
                      <label
                        key={scope}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedScopes([...selectedScopes, scope]);
                            else setSelectedScopes(selectedScopes.filter((s) => s !== scope));
                          }}
                          className="w-3.5 h-3.5 rounded text-primary"
                        />
                        <span className="font-mono text-[11px]">{scope}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  IP Allowlist (Optional CIDR / IPs, comma separated)
                </label>
                <input
                  value={ipAllowlistStr}
                  onChange={(e) => setIpAllowlistStr(e.target.value)}
                  placeholder="e.g. 192.168.1.5, 10.0.0.0/24"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreateKeyModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Generate Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Key Created Alert Modal (Raw key displayed ONCE) */}
        {showKeyCreatedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-amber-500">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Save this API key immediately!</strong> For security reasons, Orbitly never stores plain-text API keys and it will <strong>never be shown to you again</strong>.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Raw Secret API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={newlyCreatedRawKey}
                    className="flex-1 p-3 rounded-xl bg-background border border-border font-mono text-xs font-bold text-foreground"
                  />
                  <button
                    onClick={() => handleCopy(newlyCreatedRawKey, 'raw_key')}
                    className="p-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
                  >
                    {copiedId === 'raw_key' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowKeyCreatedModal(false)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  I Have Saved My Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Register Webhook Modal */}
        {showCreateWebhookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateWebhookModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Webhook className="w-4 h-4 text-primary" />
                <span>Register Outbound Webhook</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Destination URL (HTTPS Required)
                </label>
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreateWebhookModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Register Endpoint
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Modal */}
        {showDeliveriesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeliveriesModal(false)} />
            <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-bold text-base">Webhook Delivery History</h3>
              <div className="space-y-2 text-xs">
                {[
                  { event: 'post.published', status: 200, time: '10m ago' },
                  { event: 'post.scheduled', status: 200, time: '2h ago' },
                  { event: 'post.approved', status: 200, time: 'Yesterday' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between">
                    <span className="font-mono text-primary font-bold">{item.event}</span>
                    <span className="text-success font-bold">HTTP {item.status}</span>
                    <span className="text-muted-foreground">{item.time}</span>
                    <button
                      onClick={() => toast.success('Redelivery attempt sent!')}
                      className="text-xs text-primary hover:underline"
                    >
                      Redeliver
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDeliveriesModal(false)}
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
