# Incident Runbook: Database Failover & Point-In-Time Restore

## Scenario 1: Primary PostgreSQL Unresponsive
1. **Check Container Status:**
   ```bash
   docker ps -a -f name=orbitly-postgres
   docker logs --tail 100 orbitly-postgres
   ```
2. **Restart Database Container:**
   ```bash
   docker compose -f docker-compose.prod.yml restart postgres
   ```
3. **Managed Cloud Failover (AWS RDS / Supabase / Neon):**
   - If using managed PostgreSQL, trigger multi-AZ failover in the cloud console.
   - Update `DATABASE_URL` in `.env.production`.
   - Reload API and Worker services without downtime:
     ```bash
     docker compose -f docker-compose.prod.yml up -d --no-deps api worker
     ```

## Scenario 2: Restore from Automated Daily Backup
Daily backups are stored in compressed custom format under the persistent volume `backups_data` (`/backups/orbitly_backup_YYYYMMDD_HHMMSS.sql.gz`).

1. **Locate Latest Verified Snapshot:**
   ```bash
   docker exec -it orbitly-backup ls -lh /backups
   ```
2. **Stop API & Worker Containers (Prevent Concurrent Mutations):**
   ```bash
   docker compose -f docker-compose.prod.yml stop api worker web
   ```
3. **Restore PostgreSQL Database:**
   ```bash
   # Uncompress and pipe restore into pg_restore
   gunzip -c /backups/orbitly_backup_TARGET.sql.gz | docker exec -i orbitly-postgres pg_restore -U orbitly -d orbitly_prod --clean --if-exists
   ```
4. **Run Migration Check:**
   ```bash
   docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @orbitly/db migrate deploy
   ```
5. **Restart Services:**
   ```bash
   docker compose -f docker-compose.prod.yml start
   ```
6. **Verify Health:**
   ```bash
   curl -f http://localhost:4000/health/ready
   ```
