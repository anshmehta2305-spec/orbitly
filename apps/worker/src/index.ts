import * as fs from 'fs';
import * as path from 'path';

// Load .env if present
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../..', '.env'),
  path.resolve(__dirname, '../../..', '.env'),
  path.resolve(__dirname, '../../../..', '.env'),
];
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Continue
    }
  }
}

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { runChannelHealthCheck } from './schedulers/channel-health.scheduler';
import { runMissedScheduleSweeper } from './schedulers/missed-schedule.scheduler';
import { runAnalyticsSync } from './schedulers/analytics-sync.scheduler';
import { runAutomationTick } from './schedulers/automation.scheduler';
import { runDunningAndDowngradeCheck } from './schedulers/dunning.scheduler';
import { processPaymentEvents } from './processors/payment-event.processor';
import { PublishingProcessor } from './processors/publishing.processor';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'orbitly_redis_secret';

const connection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 1000, 5000);
    return delay;
  },
});

connection.on('error', (err: any) => {
  // Prevent uncaught exception crash if Redis is temporarily offline
  if (err?.code !== 'ECONNREFUSED') {
    console.error('Redis connection error:', err?.message || err);
  }
});

export const PUBLISH_QUEUE_NAME = 'publish-queue';

export async function startWorker() {
  console.log('🪐 Starting Orbitly BullMQ Publishing Worker Daemon...');
  console.log(`📡 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

  try {
    await connection.connect();
    console.log('✅ Connected to Redis cache & queue store.');
  } catch (err: any) {
    console.warn(`⚠️ Redis is currently not reachable (${err.message}). Worker will retry when Redis is ready.`);
  }

  // Queue setup
  const publishQueue = new Queue(PUBLISH_QUEUE_NAME, { connection });
  const processor = new PublishingProcessor(connection);

  // Worker processor with retries, idempotency, and exponential backoff
  const worker = new Worker(
    PUBLISH_QUEUE_NAME,
    async (job: Job) => {
      return processor.processJob(job);
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on('completed', (job, result) => {
    console.log(`[Job ${job.id}] ✅ Successfully published. External ID: ${result?.externalId || 'n/a'}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Job ${job?.id}] ❌ Failed: ${err.message}`);
  });

  // Run channel health check every 6 hours
  setInterval(() => {
    runChannelHealthCheck().catch((err) => {
      console.error('Channel health-check scheduler error:', err);
    });
  }, 6 * 60 * 60 * 1000);

  // Run missed schedule sweeper every 60 seconds
  setInterval(() => {
    runMissedScheduleSweeper(publishQueue).catch((err) => {
      console.error('Missed schedule sweeper error:', err);
    });
  }, 60 * 1000);

  // Run automation scheduler tick every 60 seconds
  setInterval(() => {
    runAutomationTick().catch((err) => {
      console.error('Automation scheduler error:', err);
    });
  }, 60 * 1000);

  // Run analytics sync hourly
  setInterval(() => {
    runAnalyticsSync().catch((err) => {
      console.error('Analytics sync error:', err);
    });
  }, 60 * 60 * 1000);

  // Run dunning and past-due grace period check daily
  setInterval(() => {
    runDunningAndDowngradeCheck().catch((err) => {
      console.error('Dunning check error:', err);
    });
  }, 24 * 60 * 60 * 1000);

  // Process asynchronous payment events every 30 seconds
  setInterval(() => {
    processPaymentEvents().catch((err) => {
      console.error('Payment events processor error:', err);
    });
  }, 30 * 1000);

  // Health heartbeat
  setInterval(() => {
    console.log(
      `[Heartbeat] 🟢 Orbitly Worker active | UTC: ${new Date().toISOString()} | Memory: ${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024,
      )}MB`,
    );
  }, 30000);

  // Graceful shutdown hooks
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal}. Shutting down gracefully...`);
    try {
      await worker.close();
      await connection.quit();
      console.log('[Worker] Graceful shutdown completed.');
      process.exit(0);
    } catch (err) {
      console.error('[Worker] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { publishQueue, worker };
}

if (require.main === module) {
  startWorker().catch((e) => {
    console.error('Fatal worker startup error:', e);
  });
}
