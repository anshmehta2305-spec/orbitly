# Contributing to Orbitly

Thank you for your interest in contributing to Orbitly! We are committed to building a clean, production-grade, original SaaS platform.

## Development Workflow
1. Fork the repo and create a feature branch (`feat/your-feature` or `fix/issue-description`).
2. Run `pnpm install` and ensure `pnpm dev` launches cleanly.
3. Write comprehensive unit and integration tests for every new function or route.
4. Verify tests and types:
   ```bash
   pnpm -r typecheck
   pnpm test
   ```
5. Follow our pull request template and submit for code review.

## Coding Conventions
- **TypeScript Strict:** No `any` types; all API responses must have strict DTOs.
- **Plan Limits Single Source of Truth:** Never hardcode plan limits in UI or controllers. Always import from `@orbitly/shared` (`PLAN_SPECS`).
- **Multi-Tenant Safety:** All database queries touching workspace resources must include `workspaceId`.
- **Secrets:** Never commit secrets, real credentials, or API keys.
