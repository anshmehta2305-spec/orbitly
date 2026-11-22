# Incident Runbook: Leaked Secret Remediation

## Severity: CRITICAL

If any production secret (`JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`, or OAuth Client Secret) is suspected or confirmed compromised:

## 1. Immediate Containment (First 15 Minutes)
1. **Identify the Leaked Secret:**
   Determine which specific variable was exposed.
2. **If `JWT_SECRET` was leaked:**
   - Immediately generate a new 32-byte secret:
     ```bash
     openssl rand -base64 32
     ```
   - Update `JWT_SECRET` in `.env.production`.
   - Restart the API service:
     ```bash
     docker compose -f docker-compose.prod.yml up -d --no-deps api
     ```
   - *Impact:* All active user sessions are immediately invalidated, forcing re-authentication. Malicious tokens become invalid instantly.

3. **If `TOKEN_ENCRYPTION_KEY` was leaked:**
   - Execute the **Token Key Rotation Runbook** (`docs/runbooks/token-key-rotation.md`) immediately.

4. **If Stripe Secret Key was leaked:**
   - Log into Stripe Dashboard > Developers > API keys.
   - Click "Roll key" on the compromised secret key.
   - Set expiration window (e.g. 1 hour) on old key.
   - Update `STRIPE_SECRET_KEY` in environment and reload API.

5. **If Database Credentials leaked:**
   - Change user password in PostgreSQL:
     ```sql
     ALTER USER orbitly WITH PASSWORD 'NEW_STRONG_PASSWORD';
     ```
   - Update `DATABASE_URL` in `.env.production` and reload containers.

## 2. Post-Incident Forensic Audit
- Query `AuditLog` table for any unauthorized administrative actions taken during the exposure window.
- Revoke and regenerate all public API keys for affected workspaces.
- File incident report and notify affected users if user credentials or tokens were accessed.
