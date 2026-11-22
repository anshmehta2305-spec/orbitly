# Orbitly - Production Deployment Guide

We recommend two deployment paths based on scale and operational preference:
- **Path A: Simple Single VPS (Docker Compose)** — Ideal for small teams, self-hosters, and early production (< 100,000 monthly posts).
- **Path B: Scalable Cloud Architecture (Managed DB + Kubernetes / ECS / Serverless)** — Ideal for high-scale multi-region SaaS (> 1,000,000 monthly posts).

---

## Path A: Simple Single VPS with Docker Compose

### Prerequisites
- A Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS, 4 vCPUs, 8GB RAM, 100GB SSD).
- Docker and Docker Compose v2 installed.
- DNS A records pointing `orbitly.app`, `api.orbitly.app`, and `media.orbitly.app` to the VPS IP address.

### Step-by-Step Instructions
1. **Clone Repo on Server:**
   ```bash
   git clone https://github.com/orbitly/orbitly.git /opt/orbitly && cd /opt/orbitly
   ```
2. **Configure Production Environment:**
   ```bash
   cp .env.example .env.production
   # Populate all secrets: JWT_SECRET, TOKEN_ENCRYPTION_KEY, STRIPE keys
   ```
3. **Launch Production Cluster:**
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```
4. **Deploy Database Schema:**
   ```bash
   docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @orbitly/db migrate deploy
   ```
5. **Verify Automatic HTTPS:**
   Caddy will automatically provision TLS certificates via Let's Encrypt for `orbitly.app` and `api.orbitly.app`. Verify status at `https://api.orbitly.app/health/ready`.

---

## Path B: Scalable Managed Cloud Architecture

For scaling beyond a single server:
- **Frontend (`apps/web`):** Deploy to **Vercel** or **AWS CloudFront + ECS** using Next.js standalone output.
- **API (`apps/api`):** Deploy to **AWS ECS Fargate**, **Fly.io**, or **Render** behind an Application Load Balancer. Scale horizontally based on CPU/Memory and HTTP request rate.
- **Worker Daemon (`apps/worker`):** Deploy as independent auto-scaling background container tasks on ECS or Kubernetes. Multiple worker pods safely co-exist because of BullMQ atomic Redis job locks.
- **Database:** **AWS Aurora PostgreSQL** (Multi-AZ) or **Neon / Supabase**.
- **Redis:** **AWS ElastiCache Redis** or **Upstash** with cluster mode enabled.
- **Storage:** **Cloudflare R2** or **AWS S3** with a custom Cloudflare CDN domain for zero egress fees.
