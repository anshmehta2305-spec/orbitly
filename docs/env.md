# Orbitly - Environment Variables Reference Guide

Every environment variable utilized across Orbitly is cataloged below with its type, default, purpose, and requirement level.

---

## 1. Core System & Host
| Variable | Type | Default | Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `NODE_ENV` | string | `development` | Yes | `development`, `test`, or `production`. |
| `PORT` | number | `3000` | No | Port for Next.js Web Application. |
| `API_PORT` | number | `4000` | No | Port for NestJS REST API. |
| `NEXT_PUBLIC_APP_URL` | string | `http://localhost:3000` | Yes | Canonical root URL of the Web app. |
| `NEXT_PUBLIC_API_URL` | string | `http://localhost:4000` | Yes | Publicly accessible URL for the API backend. |
| `CORS_ALLOWED_ORIGINS`| string | `http://localhost:3000` | No | Comma-separated list of allowed CORS origins. |

---

## 2. Database & Redis Cache
| Variable | Type | Default | Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `DATABASE_URL` | string | — | **Yes** | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`). |
| `REDIS_HOST` | string | `localhost` | Yes | Hostname for Redis instance. |
| `REDIS_PORT` | number | `6379` | No | Port for Redis instance. |
| `REDIS_PASSWORD` | string | — | No | Authentication password for Redis. |
| `REDIS_URL` | string | — | No | Combined Redis connection URL. |

---

## 3. Cryptography & Authentication
| Variable | Type | Default | Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `JWT_SECRET` | string | — | **Yes** | 32+ character secret for signing user access tokens. |
| `JWT_REFRESH_SECRET` | string | — | **Yes** | 32+ character secret for signing refresh tokens. |
| `ADMIN_JWT_SECRET` | string | — | **Yes** | 32+ character secret for signing admin impersonation tokens. |
| `TOKEN_ENCRYPTION_KEY` | hex | — | **Yes** | 64-character (32-byte) hex key for AES-256-GCM token encryption. |
| `TOKEN_ENCRYPTION_KEY_V2` | hex | — | No | Secondary key for zero-downtime key rotation. |
| `GOOGLE_CLIENT_ID` | string | — | No | Google OAuth 2.0 Client ID for user login. |
| `GOOGLE_CLIENT_SECRET` | string | — | No | Google OAuth 2.0 Client Secret. |
| `GITHUB_CLIENT_ID` | string | — | No | GitHub OAuth App Client ID. |
| `GITHUB_CLIENT_SECRET` | string | — | No | GitHub OAuth App Client Secret. |

---

## 4. Storage & Media
| Variable | Type | Default | Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `S3_ENDPOINT` | string | `http://localhost:9000` | Yes | S3-compatible endpoint (AWS, Cloudflare R2, MinIO). |
| `S3_REGION` | string | `auto` | No | AWS Region or `auto` for Cloudflare R2. |
| `S3_ACCESS_KEY_ID` | string | — | Yes | S3 Access Key. |
| `S3_SECRET_ACCESS_KEY` | string | — | Yes | S3 Secret Access Key. |
| `S3_BUCKET_NAME` | string | `orbitly-media` | Yes | Name of the media storage bucket. |
| `S3_PUBLIC_DOMAIN` | string | — | Yes | Public CDN URL for serving stored media. |

---

## 5. Payments & Billing
| Variable | Type | Default | Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `STRIPE_SECRET_KEY` | string | — | Yes | Stripe secret API key (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | string | — | Yes | Stripe webhook endpoint secret (`whsec_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | string | — | Yes | Stripe publishable key (`pk_live_...`). |
| `RAZORPAY_ENABLED` | boolean| `false` | No | Set to `true` to enable India INR checkout. |
| `RAZORPAY_KEY_ID` | string | — | No | Razorpay Key ID (`rzp_...`). |
| `RAZORPAY_KEY_SECRET` | string | — | No | Razorpay Secret Key. |
