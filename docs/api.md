# Orbitly Public REST API v1 Reference

The Orbitly Public API allows programmatic access to cross-network social scheduling, draft creation, media uploads, and analytics reporting.

## Base URLs
- **Production:** `https://api.orbitly.app/public/v1`
- **Local Development:** `http://localhost:4000/public/v1`
- **OpenAPI 3.1 JSON Specification:** `https://api.orbitly.app/public/v1/openapi.json`
- **Interactive Web Documentation:** `https://orbitly.app/docs/api`

---

## Authentication
Every request to the Public API must supply an API key in the `Authorization` header:
```http
Authorization: Bearer orb_live_YOUR_API_KEY
```
API keys are scoped and managed under **Workspace Settings > Developers** (`/settings/developers`).

### Supported Scopes
- `channels:read` — List connected social channels.
- `posts:read` — Read scheduled and published posts.
- `posts:write` — Create, schedule, edit, or delete posts.
- `media:write` — Upload binary image or video assets.
- `analytics:read` — Query reach, engagement, and click metrics.
- `slots:read` — List recurring queue posting slots.
- `webhooks:manage` — Register and inspect outbound lifecycle webhooks.

---

## Rate Limiting Headers
Every response includes real-time rate limit headers:
- `X-RateLimit-Limit`: Maximum requests permitted per minute based on workspace plan.
- `X-RateLimit-Remaining`: Remaining request quota in the active 60-second window.
- `X-RateLimit-Reset`: UTC epoch timestamp when the rate limit window resets.
- `Retry-After`: Seconds to wait before retrying when an HTTP 429 Too Many Requests response is returned.

---

## Official SDKs & Tooling
- **TypeScript / Node.js SDK:** `@orbitly/sdk`
  ```bash
  pnpm add @orbitly/sdk
  ```
- **Model Context Protocol (MCP) Server:** `@orbitly/mcp` for autonomous AI agents.
