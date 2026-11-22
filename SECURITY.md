# Security Policy & Vulnerability Disclosure

Orbitly takes the security and privacy of our global multi-tenant social media scheduling infrastructure seriously. We appreciate the responsible disclosure of vulnerabilities by security researchers and community members.

---

## 1. Reporting a Vulnerability

If you believe you have discovered a security vulnerability in Orbitly (API, Web Application, Worker daemon, MCP Server, or Mobile SDKs):

1. **Do NOT open a public GitHub issue.**
2. Send an email to **security@orbitly.app** with details of your finding.
3. Include:
   - Type of issue (e.g., SSRF, multi-tenant IDOR, auth bypass, injection)
   - Step-by-step reproduction instructions or Proof-of-Concept (PoC)
   - Affected URLs, endpoints, or parameter names
   - Potential business impact
   - Your name/handle for public acknowledgment in our Security Hall of Fame

You can encrypt sensitive communications using our PGP public key published at [https://orbitly.app/pgp-key.txt](https://orbitly.app/pgp-key.txt).

---

## 2. Response & SLA Commitments

- **Initial Acknowledgment:** Within **24 hours** of receipt.
- **Triage & Severity Assessment:** Within **48 hours**.
- **Fix & Patch Deployment:**
  - Critical (e.g. multi-tenant data leak, RCE, auth bypass): **< 24 hours**
  - High (e.g. privilege escalation, SSRF): **< 72 hours**
  - Medium/Low: Within the next regular sprint release cycle.
- **Coordinated Disclosure:** We kindly ask that you keep the vulnerability confidential until we have deployed a patch and notified affected users (typically 30 days after resolution).

---

## 3. Scope & Rules of Engagement

### In Scope
- `https://*.orbitly.app` (Production Web, API, and WebSocket gateways)
- Official Model Context Protocol Server (`@orbitly/mcp`)
- Official TypeScript Client SDK (`@orbitly/sdk`)
- Multi-tenant tenant boundary isolation (cross-workspace data access)
- Rate limiting and SSRF protection bypasses

### Out of Scope
- Denial of Service (DoS/DDoS) attacks against platform infrastructure
- Social engineering or phishing of Orbitly staff or contractors
- Physical attacks on data centers
- Third-party social platform API vulnerabilities (Meta, X, Google, LinkedIn) unless caused by Orbitly's token handling or request proxying

---

## 4. Multi-Tenant Security Guarantees
- **Strict Row-Level & Query Isolation:** Every database operation against tenant entities (`Post`, `Channel`, `Media`, `AiUsage`, `Automation`, `Membership`, `ApiKey`, `Subscription`) must explicitly enforce a `workspaceId` predicate.
- **Token Security:** OAuth refresh and access tokens are encrypted using **AES-256-GCM** with an envelope key rotation system (`TOKEN_ENCRYPTION_KEY` and `TOKEN_ENCRYPTION_KEY_V2`). Raw tokens are never logged or exposed to client browsers.
- **API Key Security:** Public API keys (`orb_live_...`) are SHA-256 hashed upon generation. Raw tokens are displayed only once to the developer.
- **Webhook Authenticity:** All outbound HTTP webhooks are signed using **HMAC-SHA256** (`X-Orbitly-Signature`) and checked with a 5-minute replay window.

---

## 5. Security Hall of Fame

Orbitly maintains a public hall of fame acknowledging ethical security researchers who help protect our community. Bug bounties are awarded for valid critical and high-severity findings according to our Bug Bounty Guidelines.
