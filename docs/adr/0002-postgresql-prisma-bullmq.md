# ADR 0002: PostgreSQL, Prisma ORM, and BullMQ for Publishing Engine

## Status
Accepted

## Context
A social media publishing platform handles high-volume scheduling, atomic state transitions, complex multi-network relational data (posts, variants, media, channels, approvals, comments), and delayed time-based job execution with automatic retries.

## Decision
- **Database:** PostgreSQL 16 with Prisma ORM for relational integrity, foreign key cascading, and type-safe query generation.
- **Queue Engine:** Redis 7 with BullMQ. We chose BullMQ over RabbitMQ/Kafka because BullMQ natively supports delayed execution (`scheduledAt` timestamps), exponential retry backoff, deterministic job IDs (`${variantId}_${timestamp}`), and distributed locking out of the box.

## Consequences
- Guaranteed exactly-once execution via BullMQ deterministic job IDs and Redis distributed locks.
- Relational integrity guaranteed for multi-stage approvals and cross-channel posts.
