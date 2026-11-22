'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code,
  Terminal,
  Key,
  ShieldCheck,
  Send,
  FileJson,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Webhook,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ApiDocsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success('Snippet copied to clipboard');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/public/v1/channels',
      scope: 'channels:read',
      desc: 'List all connected social media channels in the active workspace.',
      requestExample: {
        curl: `curl -X GET "https://api.orbitly.app/public/v1/channels" \\
  -H "Authorization: Bearer orb_live_YOUR_API_KEY"`,
        js: `import { OrbitlyClient } from '@orbitly/sdk';

const client = new OrbitlyClient({ apiKey: 'orb_live_YOUR_API_KEY' });
const { data: channels } = await client.channels.list();
console.log(channels);`,
        python: `from orbitly import Orbitly

client = Orbitly(api_key="orb_live_YOUR_API_KEY")
channels = client.channels.list()
print(channels.data)`,
      },
      responseExample: `{
  "data": [
    {
      "id": "chan_linkedin_101",
      "platform": "LINKEDIN",
      "name": "Sarah Miller",
      "avatarUrl": "https://media.orbitly.app/avatars/sm.jpg",
      "status": "CONNECTED"
    },
    {
      "id": "chan_x_202",
      "platform": "X",
      "name": "@sarahcreates",
      "avatarUrl": "https://media.orbitly.app/avatars/x.jpg",
      "status": "CONNECTED"
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/public/v1/posts',
      scope: 'posts:write',
      desc: 'Create, schedule, or immediately publish a cross-platform post submission.',
      requestExample: {
        curl: `curl -X POST "https://api.orbitly.app/public/v1/posts" \\
  -H "Authorization: Bearer orb_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelIds": ["chan_linkedin_101", "chan_x_202"],
    "content": "Excited to launch our new product today! 🚀",
    "scheduledAt": "2026-12-01T14:00:00Z",
    "publishNow": false
  }'`,
        js: `import { OrbitlyClient } from '@orbitly/sdk';

const client = new OrbitlyClient({ apiKey: 'orb_live_YOUR_API_KEY' });
const post = await client.posts.create({
  channelIds: ['chan_linkedin_101', 'chan_x_202'],
  content: 'Excited to launch our new product today! 🚀',
  scheduledAt: '2026-12-01T14:00:00Z',
});`,
        python: `from orbitly import Orbitly

client = Orbitly(api_key="orb_live_YOUR_API_KEY")
post = client.posts.create(
    channel_ids=["chan_linkedin_101", "chan_x_202"],
    content="Excited to launch our new product today! 🚀",
    scheduled_at="2026-12-01T14:00:00Z"
)`,
      },
      responseExample: `{
  "data": {
    "id": "post_9921",
    "workspaceId": "ws_123",
    "status": "SCHEDULED",
    "scheduledAt": "2026-12-01T14:00:00.000Z",
    "variants": [
      { "id": "var_1", "channelId": "chan_linkedin_101", "status": "SCHEDULED" },
      { "id": "var_2", "channelId": "chan_x_202", "status": "SCHEDULED" }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/public/v1/analytics/overview',
      scope: 'analytics:read',
      desc: 'Aggregate impressions, reach, engagements, and follower growth for the workspace.',
      requestExample: {
        curl: `curl -X GET "https://api.orbitly.app/public/v1/analytics/overview?days=30" \\
  -H "Authorization: Bearer orb_live_YOUR_API_KEY"`,
        js: `import { OrbitlyClient } from '@orbitly/sdk';

const client = new OrbitlyClient({ apiKey: 'orb_live_YOUR_API_KEY' });
const stats = await client.analytics.getOverview({ days: 30 });
console.log(stats);`,
        python: `from orbitly import Orbitly

client = Orbitly(api_key="orb_live_YOUR_API_KEY")
stats = client.analytics.get_overview(days=30)
print(stats)`,
      },
      responseExample: `{
  "data": {
    "totalImpressions": 184520,
    "totalEngagements": 14210,
    "totalClicks": 3890,
    "avgEngagementRate": 0.077,
    "periodDays": 30
  }
}`,
    },
    {
      method: 'POST',
      path: '/public/v1/webhooks',
      scope: 'webhooks:manage',
      desc: 'Register an outbound webhook endpoint to receive real-time publishing lifecycle events.',
      requestExample: {
        curl: `curl -X POST "https://api.orbitly.app/public/v1/webhooks" \\
  -H "Authorization: Bearer orb_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/webhooks/orbitly",
    "events": ["post.published", "post.failed"],
    "description": "Production sync server"
  }'`,
        js: `import { OrbitlyClient } from '@orbitly/sdk';

const client = new OrbitlyClient({ apiKey: 'orb_live_YOUR_API_KEY' });
const webhook = await client.webhooks.create({
  url: 'https://your-domain.com/webhooks/orbitly',
  events: ['post.published', 'post.failed'],
});`,
        python: `from orbitly import Orbitly

client = Orbitly(api_key="orb_live_YOUR_API_KEY")
webhook = client.webhooks.create(
    url="https://your-domain.com/webhooks/orbitly",
    events=["post.published", "post.failed"]
)`,
      },
      responseExample: `{
  "data": {
    "id": "whk_550e",
    "url": "https://your-domain.com/webhooks/orbitly",
    "events": ["post.published", "post.failed"],
    "secret": "whsec_99af281048bce..."
  }
}`,
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border">
        <Container className="space-y-4 text-center max-w-4xl">
          <Badge variant="pulse">Orbitly Public REST API v1</Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
            Developer API & Webhooks
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Programmatically schedule social posts, query performance analytics, connect custom publishing pipelines,
            and build AI agent integrations with the official Orbitly Public REST API.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href={`/${locale}/settings/developers`}>
              <Button variant="default" className="gap-2 font-bold shadow-lg shadow-primary/20">
                <Key className="w-4 h-4" /> Generate API Key
              </Button>
            </Link>
            <a
              href="http://localhost:4000/public/v1/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2 font-semibold">
                <FileJson className="w-4 h-4" /> Download OpenAPI 3.1 Spec
              </Button>
            </a>
          </div>
        </Container>
      </Section>

      <Container className="py-12 max-w-6xl space-y-16">
        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Bearer Token Auth</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate all API requests via the standard <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">Authorization: Bearer orb_live_...</code> header.
              Keys are strictly scoped and hash-verified.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Rate Limits & Headers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard tiers receive between 60 and 1,000 requests per minute per workspace.
              Response headers include <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">X-RateLimit-Remaining</code> and <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">Retry-After</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Webhook className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Signed Webhooks</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive outbound lifecycle webhooks when posts publish or fail. Every payload is signed with
              HMAC-SHA256 in the <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">X-Orbitly-Signature</code> header.
            </p>
          </div>
        </div>

        {/* Code Language Switcher */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">API Endpoints Reference</h2>
            <p className="text-xs text-muted-foreground">Select your preferred programming language or CLI tool</p>
          </div>
          <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
            {(['curl', 'js', 'python'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeLang === lang
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'curl' ? 'cURL' : lang === 'js' ? 'TypeScript SDK' : 'Python'}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-10">
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-2xl border border-border bg-card/50 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-black font-mono ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : ep.method === 'POST'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : ep.method === 'PATCH'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-base font-bold font-mono text-foreground">{ep.path}</span>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono border-border">
                  Scope: {ep.scope}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">{ep.desc}</p>

              {/* Request & Response Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-black/60 p-4 space-y-2 relative">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-white/10">
                    <span className="font-mono text-white/80">Request ({activeLang})</span>
                    <button
                      onClick={() => copyToClipboard(ep.requestExample[activeLang], `req-${idx}`)}
                      className="p-1 hover:text-white transition-colors"
                    >
                      {copiedSection === `req-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-emerald-400/90 overflow-x-auto p-2 leading-relaxed">
                    {ep.requestExample[activeLang]}
                  </pre>
                </div>

                <div className="rounded-xl border border-border bg-black/60 p-4 space-y-2 relative">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-white/10">
                    <span className="font-mono text-white/80">Response (200 OK)</span>
                    <button
                      onClick={() => copyToClipboard(ep.responseExample, `res-${idx}`)}
                      className="p-1 hover:text-white transition-colors"
                    >
                      {copiedSection === `res-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-sky-400/90 overflow-x-auto p-2 leading-relaxed">
                    {ep.responseExample}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Context Protocol (MCP) Server Showcase */}
        <div className="p-8 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="default" className="bg-primary text-white font-bold">
                AI Agent Integration
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Official Orbitly MCP Server
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Connect Claude Desktop, Cursor, or your autonomous AI agents to Orbitly via the Model Context Protocol (MCP).
                Agents can inspect channels, schedule drafts, query analytics, and draft multi-platform campaigns directly.
              </p>
            </div>
            <Link href={`/${locale}/settings/developers`}>
              <Button variant="default" className="font-bold gap-2 shrink-0">
                Setup MCP Server <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-black/80 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-white/10">
              <span className="font-mono text-white/80">claude_desktop_config.json</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `{
  "mcpServers": {
    "orbitly": {
      "command": "node",
      "args": ["/path/to/orbitly/apps/mcp/dist/index.js"],
      "env": {
        "ORBITLY_API_KEY": "orb_live_YOUR_API_KEY",
        "ORBITLY_API_URL": "https://api.orbitly.app"
      }
    }
  }
}`,
                    'mcp-cfg'
                  )
                }
                className="p-1 hover:text-white transition-colors"
              >
                {copiedSection === 'mcp-cfg' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-purple-300 overflow-x-auto p-2 leading-relaxed">
{`{
  "mcpServers": {
    "orbitly": {
      "command": "node",
      "args": ["/path/to/orbitly/apps/mcp/dist/index.js"],
      "env": {
        "ORBITLY_API_KEY": "orb_live_YOUR_API_KEY",
        "ORBITLY_API_URL": "https://api.orbitly.app"
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </Container>
    </div>
  );
}
