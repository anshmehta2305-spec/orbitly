# Orbitly - OWASP Top 10 Security Review & Evidence Checklist

This document details the security posture, control implementation, and verification evidence for the Orbitly multi-tenant SaaS platform against the **OWASP Top 10 (2021)** framework.

---

## OWASP Top 10 Review Matrix

| OWASP Category | Vulnerability Type | Orbitly Control & Defense | Implementation Evidence |
| :--- | :--- | :--- | :--- |
| **A01:2021** | **Broken Access Control** | • Strict multi-tenant row-level workspace scoping on all entities.<br>• `TenantIsolationViolationError` enforced by `packages/db/src/tenant-guard.ts`.<br>• Role-Based Access Control (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`) via `@RequireRole()`.<br>• Impersonation is time-bound (60m) with prominent banner and signed JWT. | `packages/db/src/tenant-guard.ts`<br>`apps/api/src/common/guards/roles.guard.ts`<br>`apps/api/src/modules/admin/guards/platform-admin.guard.ts` |
| **A02:2021** | **Cryptographic Failures** | • OAuth access and refresh tokens encrypted with **AES-256-GCM**.<br>• Zero-downtime key rotation (`TOKEN_ENCRYPTION_KEY_V1` and `TOKEN_ENCRYPTION_KEY_V2`).<br>• User passwords hashed with bcrypt (salt rounds = 12).<br>• Public API keys hashed with **SHA-256** before storage.<br>• Outbound webhooks signed with **HMAC-SHA256**. | `packages/shared/src/security/encryption.ts`<br>`packages/shared/src/security/api-key.ts`<br>`packages/shared/src/security/webhook-signing.ts`<br>`apps/api/src/modules/auth/auth.service.ts` |
| **A03:2021** | **Injection** | • 100% parameterised SQL queries through Prisma ORM (zero raw string concatenation).<br>• Global NestJS `ValidationPipe` with `forbidNonWhitelisted: true` to prevent mass-assignment.<br>• Strict Zod schema parsing for all user input and API payloads. | `apps/api/src/main.ts`<br>`packages/shared/src/schemas/` |
| **A04:2021** | **Insecure Design** | • Plan entitlements enforced server-side via single source of truth `PLAN_SPECS`.<br>• Publishing state machine with distributed Redis mutex locks preventing duplicate publishing.<br>• Idempotent payment webhook processing via unique `PaymentEvent.eventId`. | `packages/shared/src/constants/plans.ts`<br>`packages/shared/src/services/entitlements.ts`<br>`apps/api/src/modules/billing/billing.service.ts` |
| **A05:2021** | **Security Misconfiguration** | • Startup security verification (`validateProductionSecrets`) fails fast if secrets are missing or weak.<br>• Hardened HTTP response headers (HSTS, CSP, X-Frame-Options: DENY, nosniff, Referrer-Policy).<br>• Non-root container execution (`nextjs`, `nestjs`, `worker`). | `apps/api/src/common/security/startup-validation.ts`<br>`apps/web/next.config.ts`<br>`apps/api/Dockerfile` |
| **A06:2021** | **Vulnerable & Outdated Components** | • Zero GPL/AGPL dependencies (closed-source SaaS compliant).<br>• Minimal Alpine Linux container base images with pinned versions.<br>• Dependabot and CI dependency scanning enabled. | `scratch/audit_report.json`<br>`.github/workflows/ci.yml` |
| **A07:2021** | **Identification & Authentication Failures** | • 15-minute access token + 7-day rolling refresh token lifecycle.<br>• Brute-force rate limiting on auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`).<br>• 5-failed attempt lockout on public share link portals.<br>• Secure cookie flags (`HttpOnly`, `Secure`, `SameSite=Lax`). | `apps/api/src/modules/auth/auth.controller.ts`<br>`apps/api/src/__tests__/team-approvals-api.test.ts` |
| **A08:2021** | **Software & Data Integrity Failures** | • Outbound webhooks verify payload integrity using HMAC-SHA256 signatures with 5-minute replay windows.<br>• Inbound Stripe/Razorpay webhook signatures verified cryptographically.<br>• File uploads verified by magic bytes, not untrusted file extensions. | `packages/shared/src/security/webhook-signing.ts`<br>`apps/api/src/modules/billing/providers/stripe.provider.ts`<br>`apps/api/src/__tests__/multi-tenant-isolation.test.ts` |
| **A09:2021** | **Security Logging & Monitoring Failures** | • Tamper-evident, immutable audit trail for administrative actions.<br>• Correlation ID tracking (`X-Correlation-Id`) propagated across all services.<br>• Automatic PII redaction (Bearer tokens, passwords, keys, card numbers) in structured logs. | `apps/api/src/common/logger/structured-logger.ts`<br>`apps/api/src/common/middleware/correlation-id.middleware.ts`<br>`apps/api/src/common/services/audit.service.ts` |
| **A10:2021** | **Server-Side Request Forgery (SSRF)** | • Dedicated SSRF validation engine (`isSafePublicUrl`).<br>• Blocks localhost, 127.0.0.1, 169.254.169.254 (cloud metadata), RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).<br>• Applied to RSS feeds, media imports, MCP tools, and webhooks. | `packages/shared/src/security/ssrf.ts`<br>`packages/shared/src/__tests__/ssrf.test.ts`<br>`apps/mcp/src/server.ts` |

---

## Verification & Test Evidence
- Multi-tenant isolation test suite: `apps/api/src/__tests__/multi-tenant-isolation.test.ts`
- SSRF test suite: `packages/shared/src/__tests__/ssrf.test.ts`
- Webhook signature test suite: `packages/shared/src/__tests__/webhook-hmac.test.ts`
- Playwright E2E security flows: `apps/web/e2e/billing-api-admin.spec.ts`
