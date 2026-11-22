# Orbitly — Step 10: Post-Launch Growth and Expansion
## Comprehensive Release Notes & Operational Migration Guide

This document covers the architectural upgrades, schema migrations, and operational procedures implemented during Step 10 across all 6 increments.

---

### Table of Contents
1. [Increment 1: Activation & Onboarding](#increment-1-activation--onboarding)
2. [Increment 2: More Platforms (TikTok, Pinterest, Reddit)](#increment-2-more-platforms-tiktok-pinterest-reddit)
3. [Increment 3: Mobile Apps (Expo & Push Notifications)](#increment-3-mobile-apps-expo--push-notifications)
4. [Increment 4: Enterprise SSO, SCIM & Compliance](#increment-4-enterprise-sso-scim--compliance)
5. [Increment 5: Integrations Ecosystem (Zapier, Make, Slack Bot, Chrome Extension)](#increment-5-integrations-ecosystem)
6. [Increment 6: Global Scale, Data Residency & Enterprise Tiers](#increment-6-global-scale-data-residency--enterprise-tiers)
7. [Database Migration Reference & Runbook](#database-migration-reference--runbook)
8. [Environment Variables Reference](#environment-variables-reference)

---

### Increment 1: Activation & Onboarding
- **Goal**: Help new users reach "first post scheduled" within 10 minutes.
- **Key Deliverables**:
  - `UserOnboarding` model tracking setup checklist progress (`connectedChannel`, `createdPost`, `scheduledPost`, `invitedMember`, `triedAi`).
  - Deterministic A/B testing framework (`abVariant: 'A' | 'B'`) for onboarding flows.
  - Lifecycle email triggers with CAN-SPAM / GDPR unsubscribe preferences center.
  - Funnel event tracking (`FunnelEvent` model) tracking `SIGNUP -> VERIFIED -> CHANNEL_CONNECTED -> POST_SCHEDULED -> UPGRADE`.
  - Admin funnel metrics dashboard (`/admin/funnel`).

---

### Increment 2: More Platforms (TikTok, Pinterest, Reddit)
- **Goal**: Expand social distribution to video, image curation, and community discussion platforms.
- **Key Deliverables**:
  - **TikTok Provider Plugin** (`TikTokProvider`):
    - Video-only publishing (`maxVideoMb: 500`, `maxVideoSec: 600`), privacy level controls (`PUBLIC`, `MUTUAL_FOLLOW_FRIENDS`, `SELF_ONLY`), comment, duet, and stitch toggles.
  - **Pinterest Provider Plugin** (`PinterestProvider`):
    - Board ID mapping, rich destination link URLs, carousel and single-pin media payloads.
  - **Reddit Provider Plugin** (`RedditProvider`):
    - Subreddit targeting (`r/subreddit`), post types (link, image, text), NSFW and spoiler flags.
  - All providers fully registered in `ProviderRegistry` with validation, normalization, and test suites.

---

### Increment 3: Mobile Apps (React Native + Expo Companion)
- **Goal**: Mobile-first notification-based companion app for Instagram Stories, Reels, and personal reminders.
- **Key Deliverables**:
  - Created `apps/mobile` workspace (`@orbitly/mobile`).
  - Mobile Push Notification Service (`MobilePushNotificationService`) integrating Expo Push Notifications (`ExponentPushToken[...]`).
  - Two-tap manual notification posting workflow (`NotificationBasedPostingService`):
    - Automatically copies post captions and hashtags to system clipboard.
    - Deep-links directly to target platform mobile apps (`instagram://camera`, `tiktok://`).
  - Push notification event routing: `POST_PUBLISHED`, `APPROVAL_REQUESTED`, `POST_FAILED`, `MANUAL_POST_REMINDER`.

---

### Increment 4: Enterprise SSO, SCIM & Compliance
- **Goal**: Enterprise identity integration and SOC 2 Type II audit readiness.
- **Key Deliverables**:
  - SAML 2.0 & OIDC Single Sign-On service (`SsoService`) supporting Okta, Azure AD, and Google Workspace.
  - Domain-level enforced SSO with early rejection in `AuthService.login`.
  - RFC 7644 SCIM 2.0 REST provisioning API (`/scim/v2/Users`) for automated directory synchronization and deprovisioning.
  - Real-time SIEM audit stream forwarding in **Splunk HEC** and **Datadog Logs API v2** formats.
  - Automated daily backup integrity verification (`BackupVerificationService`) ensuring SLA commitments:
    - **RPO**: $\le 15$ minutes.
    - **RTO**: $\le 30$ minutes.
  - SOC 2 access controls: Inactivity Session Timeout Guard (`SessionTimeoutGuard`) and CIDR IP Allowlisting Guard (`IpAllowlistGuard`).

---

### Increment 5: Integrations Ecosystem
- **Goal**: Automate publishing workflows from external business systems.
- **Key Deliverables**:
  - **Zapier CLI App** (`packages/integrations/zapier`):
    - Triggers: `new_post_published`, `post_failed`.
    - Actions: `create_post`, `upload_media`.
    - Complete OpenAPI 3.0 specification (`openapi.json`).
  - **Make (Integromat) App** (`packages/integrations/make`):
    - Instant webhook triggers (`watchPostsPublished`, `watchPostsFailed`) and action modules (`createPost`, `uploadMedia`, `listChannels`).
  - **Slack Bot Integration** (`apps/api/src/modules/integrations/slack`):
    - Slack App Manifest (`manifest.json` & `slack-manifest.yaml`).
    - HMAC-SHA256 signature verification with replay attack protection.
    - Interactive Block Kit notifications with actionable buttons ("Approve", "Reject", "Retry Publishing").
    - Slash commands: `/orbitly schedule <text>`, `/orbitly queue`, `/orbitly help`.
  - **Chrome Extension (Manifest V3)** (`apps/extension`):
    - DOM Open Graph & Twitter Card metadata extractor (`src/extractor.ts`).
    - Context menu "Share with Orbitly".
    - Mini-composer popup UI (`src/popup/popup.html`) with channel toggles and direct public API scheduling.

---

### Increment 6: Global Scale, Data Residency & Enterprise Tiers
- **Goal**: Sovereign multi-region data residency, GDPR governance, and enterprise tier branding.
- **Key Deliverables**:
  - **Multi-Region Data Residency (`US` vs `EU`)**:
    - Database, Redis, S3/MinIO bucket, and worker queues isolated by region.
    - Strict Data Isolation Guard (`DataResidencyGuard`): asserts EU customer data never leaves `eu-central-1` (Frankfurt).
    - Dedicated Egress IP Pools for enterprise publishing and webhook traffic.
  - **Data Retention & Legal Hold**:
    - Configurable retention periods for analytics snapshots, audit logs, and soft-deleted posts.
    - Legal Hold toggle: immediately suspends and freezes all pruning and deletions across the workspace.
  - **GDPR / CCPA Self-Serve Privacy**:
    - Machine-readable full workspace data export (`POST /enterprise/compliance/export`).
    - Article 17 "Right to be Forgotten" erasure pipeline (`POST /enterprise/compliance/erasure`) anonymizing user PII and revoking sessions.
  - **Enterprise Tier Branding & SLA Dashboard**:
    - Cloudflare / Let's Encrypt automated custom domain SSL provisioning.
    - Custom email sending domain verification with SPF, DKIM, and DMARC status checks.
    - Enterprise SLA metrics: 99.99% uptime, 10x rate limits (600 req/min), and continuous WAL replication.

---

### Database Migration Reference & Runbook

#### Added Prisma Schema Enums & Models
```prisma
enum DataRegion {
  US
  EU
}

// In Workspace
model Workspace {
  region                DataRegion  @default(US)
  dedicatedEgressIpPool String[]    @default([])
  dataExports           DataExportRequest[]
  @@index([region])
}

// In WorkspaceSettings
model WorkspaceSettings {
  customDomainSslStatus    String?
  customDomainSslIssuedAt  DateTime?
  emailDomain              String?
  emailDkimStatus          String?
  emailSpfStatus           String?
  emailDmarcStatus         String?
  analyticsRetentionDays   Int      @default(365)
  auditLogRetentionDays    Int      @default(365)
  deletedPostRetentionDays Int      @default(30)
  legalHold                Boolean  @default(false)
}

model DataExportRequest {
  id           String    @id @default(cuid())
  workspaceId  String
  userId       String
  status       String    @default("PENDING")
  format       String    @default("JSON")
  downloadUrl  String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  completedAt  DateTime?
}

model RightToBeForgottenRequest {
  id           String    @id @default(cuid())
  userId       String
  email        String
  status       String    @default("PENDING")
  anonymizedAt DateTime?
  requestedAt  DateTime  @default(now())
}
```

#### Production Deployment Runbook
1. **Apply Migrations**:
   ```bash
   pnpm db:generate
   pnpm --filter @orbitly/db exec prisma migrate deploy
   ```
2. **Build and Typecheck Monorepo**:
   ```bash
   pnpm -r typecheck
   pnpm -r build
   ```
3. **Execute Verification Test Suite**:
   ```bash
   pnpm test
   ```
4. **Deploy Regional Services**:
   - For EU regions, set `SERVER_REGION=EU` in European Kubernetes clusters.
   - For US regions, set `SERVER_REGION=US` in US Kubernetes clusters.
