# ==========================================
# Orbitly MCP Server - Production Dockerfile
# Model Context Protocol service for AI Agents
# ==========================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/mcp/package.json ./apps/mcp/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/mcp/node_modules ./apps/mcp/node_modules

COPY . .

ENV NODE_ENV=production

RUN pnpm --filter @orbitly/shared build
RUN pnpm --filter @orbitly/mcp build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV MCP_PORT=8000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcp

COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=mcp:nodejs /app/apps/mcp/dist ./apps/mcp/dist
COPY --from=builder --chown=mcp:nodejs /app/apps/mcp/package.json ./apps/mcp/package.json

USER mcp

EXPOSE 8000

CMD ["node", "apps/mcp/dist/index.js", "--http"]
