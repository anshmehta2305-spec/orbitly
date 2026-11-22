# Orbitly - Comprehensive Architecture Guide

## 1. High-Level Vision & Design Goals
Orbitly is designed as a high-concurrency, multi-tenant social media command center.
Core architectural tenets:
1. **Single Source of Truth Plan Limits:** All entitlements, quotas, prices, and capabilities are defined once in `packages/shared/src/constants/plans.ts` and consumed identically by Web UI, REST API, Public API, Worker daemon, and MCP server.
2. **UTC-First Deterministic Scheduling:** Every schedule date is normalized to UTC in the database. Client browsers supply their IANA timezone; local times are calculated at display time, correctly preserving DST transitions.
3. **Decoupled Asynchronous Publishing Engine:** Web requests only stage and enqueue posts into PostgreSQL and BullMQ. Upstream social network publication is executed asynchronously by distributed worker nodes with exponential backoff and jitter.
4. **Strict Multi-Tenant Isolation:** All database reads and writes enforce a `workspaceId` condition via `assertWorkspaceScope` guards.

---

## 2. Monorepo Structure & Package Boundaries
- **`apps/web`**: Next.js 15 App Router providing the marketing site, application dashboard, composer modal, interactive calendar, approvals inbox, client share portals, developer settings, and platform admin console.
- **`apps/api`**: NestJS modular service handling authentication, RBAC, billing webhooks (Stripe/Razorpay), developer API v1 (`/public/v1/*`), and platform administration.
- **`apps/worker`**: Node.js BullMQ daemon executing background publishing jobs, dunning grace-period sweepers, RSS syndication, evergreen recycling, and analytics sync.
- **`apps/mcp`**: Official Model Context Protocol server exposing scoped tools (`list_channels`, `create_post`, `get_analytics_overview`, etc.) for Claude Desktop and autonomous AI agents.
- **`packages/db`**: Prisma schema with 25+ models, migrations, and tenant isolation assertions.
- **`packages/shared`**: Reusable Zod schemas, AES-256-GCM encryption helpers, HMAC webhook signers, SSRF guards, and plan specifications.
- **`packages/sdk`**: Official TypeScript/JavaScript client SDK (`@orbitly/sdk`).

---

## 3. The Publishing Pipeline Life Cycle
```
[User / MCP Agent]
       │
       ▼ (POST /posts)
[API: Entitlement Check & Validation]
       │
       ▼ (Prisma Transaction)
[Post (SCHEDULED) + PostVariants Created]
       │
       ▼ (Deterministic Job ID)
[BullMQ Publishing Queue in Redis]
       │ (Delayed until scheduledAt UTC)
       ▼
[Worker Node: Atomic Lock Acquisition]
       │
       ▼ (Decryption of OAuth Credentials)
[Social Provider Plugin (e.g. LinkedIn, Meta, X)]
       │
       ├──► [Success] ──► PostVariant: PUBLISHED, Post status computed rollup
       └──► [Failure] ──► PostVariant: FAILED with error code; exponential retry
```

---

## 4. Multi-Tenant Security Model
Multi-tenancy is enforced at multiple layers:
1. **HTTP Layer:** Guards extract `workspaceId` from authenticated sessions or API key metadata.
2. **Controller Layer:** `@RequireRole()` checks membership in target workspace (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
3. **Database Layer:** `packages/db/src/tenant-guard.ts` verifies that `where.workspaceId` is present on all tenant queries, preventing unintended cross-workspace access.
