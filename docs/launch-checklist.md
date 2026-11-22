# Orbitly Production Launch Checklist

This checklist tracks readiness for commercial public launch across infrastructure, compliance, security, and operations.

---

## Part 1: Pre-Launch Readiness

### A. Infrastructure, Domains & DNS
- [x] **Monorepo Build & Typecheck:** 100% clean typecheck (`pnpm -r typecheck`) across all packages. — **Done**
- [x] **Test Suite & Coverage:** 114 unit, integration, and security tests passing. — **Done**
- [x] **Docker Containerization:** Multi-stage, non-root Alpine Dockerfiles created for web, api, worker, and mcp. — **Done**
- [x] **Reverse Proxy & HTTPS:** Caddy configured with automatic Let's Encrypt TLS and HSTS. — **Done**
- [ ] **DNS Records:** Point `orbitly.app`, `api.orbitly.app`, and `media.orbitly.app` to production IP. — **Needs your action:** Add DNS A records in your DNS registrar (Cloudflare / Route53).
- [ ] **Email Authentication (SPF, DKIM, DMARC):** — **Needs your action:** Add TXT records for SPF (`v=spf1 include:postmarkapp.com ~all`), DKIM, and DMARC (`v=DMARC1; p=reject; rua=mailto:dmarc@orbitly.app`).

### B. Security & Secrets Management
- [x] **Zero Hardcoded Secrets in Codebase:** Verified via audit script and Gitleaks CI scan. — **Done**
- [x] **Startup Fail-Fast Secret Validator:** Validates production JWT secrets, encryption keys, and DB. — **Done**
- [x] **Multi-Tenant Row Isolation Guard:** `packages/db/src/tenant-guard.ts` asserting `workspaceId`. — **Done**
- [x] **OWASP Top 10 Review & Evidence:** Documented in `docs/security-review.md`. — **Done**
- [x] **Security Disclosure Policy & security.txt:** `SECURITY.md` and `/.well-known/security.txt`. — **Done**
- [ ] **Production Secret Provisioning:** — **Needs your action:** Generate production 32-byte secrets (`openssl rand -base64 32` for `JWT_SECRET`, `openssl rand -hex 32` for `TOKEN_ENCRYPTION_KEY`) in `.env.production`.

### C. Payments & Invoicing
- [x] **Stripe Integration & Idempotent Webhooks:** `PaymentEvent` deduplication and 7-day grace period. — **Done**
- [x] **Single Source of Truth Plan Limits:** `PLAN_SPECS` in `packages/shared`. — **Done**
- [ ] **Stripe Production Mode Activation:** — **Needs your action:** Switch Stripe to Live mode. Create Live Products matching `PLAN_SPECS` price IDs, set `STRIPE_SECRET_KEY=sk_live_...` and configure webhook destination `https://api.orbitly.app/billing/webhooks/stripe`.
- [ ] **Razorpay Live Activation (Optional):** — **Needs your action:** If enabling India payments, enter live Key ID and Secret in `.env.production`.

### D. Third-Party Platform API Approvals
- [x] **Developer Review Runbook:** Documented in `docs/platform-reviews.md`. — **Done**
- [ ] **Submit App Reviews:** — **Needs your action:** Submit developer verification screencasts for Meta (Instagram Graph), LinkedIn (Community Management API), and YouTube (Data API v3).

### E. Legal & Compliance
- [x] **Sub-Processors List:** Documented in `docs/legal/sub-processors.md`. — **Done**
- [x] **Data Processing Addendum:** Template in `docs/legal/dpa-template.md`. — **Done**
- [x] **GDPR Right to Data Portability:** Automated JSON export service implemented. — **Done**
- [ ] **Legal Review:** — **Needs your action:** Have legal counsel review Terms of Service, Privacy Policy, and DPA.

### F. Observability & Operations
- [x] **Structured JSON Logging with PII Redaction:** Implemented in `OrbitlyStructuredLogger`. — **Done**
- [x] **Grafana Monitoring Dashboard:** Ready-made JSON in `monitoring/grafana-dashboard.json`. — **Done**
- [x] **Alerting Rules Definition:** Prometheus alert rules in `monitoring/alerts.yml`. — **Done**
- [x] **Operational Incident Runbooks:** 6 runbooks created under `docs/runbooks/`. — **Done**
- [x] **Automated Database Daily Backups:** Script configured in `docker-compose.prod.yml`. — **Done**

---

## Part 2: Launch Day & First 30 Days Operations Plan

### Launch Day Checklist
1. Deploy production containers: `docker compose -f docker-compose.prod.yml up -d`.
2. Run database migration deploy: `pnpm --filter @orbitly/db migrate deploy`.
3. Check health status: `curl https://api.orbitly.app/health/ready`.
4. Perform live smoke test: Register real account, connect test social account, publish live post, verify billing checkout in test mode.
5. Announce Staged Invite-Only Beta to initial 100 beta creators.

### First 30 Days Operations Cadence
- **Daily (Morning):**
  - Check Grafana dashboard for error spikes (`http_requests_total{status=~"5.."}`).
  - Check BullMQ queue lag (`bullmq_queue_delayed_jobs`).
  - Verify that daily PostgreSQL backup completed without error.
  - Review Stripe billing events for unexpected payment failures or dispute alerts.
- **Weekly:**
  - Review AI Studio credit expenditure against margin thresholds.
  - Check social platform token expiration notices and refresh error logs.
  - Review user feedback from in-app widget.
- **Monthly:**
  - Execute a test database restore from backup to a staging instance.
  - Review sub-processor security statuses and rotate API keys if necessary.
