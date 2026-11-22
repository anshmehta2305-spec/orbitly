# Orbitly - Zero-Downtime Database Migration Strategy

Orbitly uses Prisma ORM with PostgreSQL. For production deployments with active traffic, database schema changes must follow the **Expand and Contract** pattern to prevent downtime.

---

## The Expand and Contract Pattern

Never rename or drop columns in a single release. Follow these 3 phases across sequential releases:

### Phase 1: Expand (Additive Changes)
1. Add new columns as **nullable** or with default values.
2. Example: Adding `authorDisplayName` alongside `authorId`.
3. Run `prisma migrate deploy` in the pre-deployment release step.
4. Existing running instances continue reading and writing to old columns without error.

### Phase 2: Dual-Writing (Application Rollout)
1. Deploy the new application version.
2. Application writes to both the old and new columns simultaneously.
3. Reads fall back to the old column if the new column is null.
4. Run a background backfill script to populate the new column for historical rows.

### Phase 3: Contract (Cleanup)
1. Once all historical rows have been populated and verified, update the application to read and write exclusively to the new column.
2. In the subsequent release, drop the old column or add `NOT NULL` constraints:
   ```sql
   ALTER TABLE "Post" DROP COLUMN "oldColumn";
   ```

---

## Safe vs Dangerous Schema Operations

| Operation | Safety | Safe Alternative |
| :--- | :---: | :--- |
| **Add nullable column** | ✅ Safe | Execute directly in `prisma migrate deploy`. |
| **Add column with default** | ✅ Safe | Safe in PostgreSQL 11+ (metadata-only update). |
| **Add index concurrently** | ⚠️ Caution | Use `CREATE INDEX CONCURRENTLY` to avoid table locks. |
| **Rename column** | ❌ Dangerous | Add new column -> Dual-write -> Backfill -> Drop old column. |
| **Drop column** | ❌ Dangerous | Stop writing to column in release N -> Drop in release N+1. |
| **Change column type** | ❌ Dangerous | Add new column with new type -> Dual-write -> Switch -> Drop old. |
