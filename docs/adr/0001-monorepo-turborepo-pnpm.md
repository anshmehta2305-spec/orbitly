# ADR 0001: Monorepo Structure with pnpm Workspaces & Turborepo

## Status
Accepted

## Context
Orbitly requires multiple applications (`web`, `api`, `worker`, `mcp`) and shared libraries (`db`, `shared`, `sdk`, `config`). We needed efficient caching, single-version dependency management, and unified TypeScript types without published package overhead.

## Decision
We chose **pnpm workspaces** paired with **Turborepo**:
- Strict dependency isolation preventing phantom dependencies.
- Fast disk-efficient symlink node_modules structure.
- Turborepo remote caching capability for fast CI lint, typecheck, and test pipelines.

## Consequences
- Fast pipeline runs across monorepo packages.
- Shared code changes (`@orbitly/shared`) propagate instantly without npm publishing steps.
