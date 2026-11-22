# Incident Runbook: Posts Not Publishing

## Symptoms
- Alert `QueueLagHigh` firing.
- User tickets reporting scheduled posts stuck in `SCHEDULED` status past publication time.
- BullMQ queue inspector showing growing `waiting` or `delayed` count with 0 active progress.

## Immediate Diagnosis Steps
1. **Check Worker Daemon Status:**
   ```bash
   docker ps -f name=orbitly-worker
   docker logs --tail 100 -f orbitly-worker
   ```
2. **Inspect Redis Connectivity & Memory:**
   ```bash
   docker exec -it orbitly-redis redis-cli -a "$REDIS_PASSWORD" ping
   docker exec -it orbitly-redis redis-cli -a "$REDIS_PASSWORD" info memory
   ```
3. **Query Stuck Posts via DB:**
   ```sql
   SELECT id, "workspaceId", status, "scheduledAt"
   FROM "Post"
   WHERE status = 'SCHEDULED' AND "scheduledAt" < NOW() - INTERVAL '5 minutes'
   LIMIT 50;
   ```

## Mitigation & Recovery
1. **If Worker Process is Dead / Crashed:**
   Restart the worker container:
   ```bash
   docker compose -f docker-compose.prod.yml restart worker
   ```
2. **If Upstream Rate Limited:**
   Check the Admin Console at `/admin/providers` for upstream latency/error spikes. If a single platform is failing, activate the emergency kill switch for that provider to allow other networks to publish unimpeded.
3. **Trigger Missed Schedule Sweeper:**
   Run the sweeper manual trigger:
   ```bash
   curl -X POST https://api.orbitly.app/admin/queues/sweep-missed -H "Authorization: Bearer $ADMIN_TOKEN"
   ```
