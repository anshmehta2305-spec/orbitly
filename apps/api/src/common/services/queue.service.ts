import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

export const PUBLISH_QUEUE_NAME = 'publish-queue';
export const DLQ_QUEUE_NAME = 'publish-dlq';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection!: Redis;
  public publishQueue!: Queue;
  public dlqQueue!: Queue;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || 'orbitly_redis_secret';

    this.connection = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: true,
    });

    this.connection.connect().catch((err) => {
      this.logger.warn(`Redis not available (${err.message}). Queue operations will queue in memory or retry.`);
    });

    this.publishQueue = new Queue(PUBLISH_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });

    this.dlqQueue = new Queue(DLQ_QUEUE_NAME, {
      connection: this.connection,
    });

    this.logger.log('Publish Queue initialized with deterministic job replacement.');
  }

  async onModuleDestroy() {
    await this.publishQueue?.close();
    await this.dlqQueue?.close();
    this.connection?.disconnect();
  }

  /**
   * Deterministic Job ID format: variantId_timestamp
   * Ensures rescheduling replaces old job and prevents double-publishing
   */
  public generateJobId(variantId: string, scheduledAt: Date): string {
    return `${variantId}_${scheduledAt.getTime()}`;
  }

  /**
   * Schedules a delayed BullMQ job for a PostVariant
   */
  async scheduleVariant(
    variantId: string,
    postId: string,
    workspaceId: string,
    scheduledAt: Date,
    correlationId?: string,
  ): Promise<Job> {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    const jobId = this.generateJobId(variantId, scheduledAt);

    // Cancel any existing jobs for this variant before replacing
    await this.cancelVariantJob(variantId);

    const job = await this.publishQueue.add(
      'publish-variant',
      {
        variantId,
        postId,
        workspaceId,
        scheduledAt: scheduledAt.toISOString(),
        correlationId: correlationId || `cid_${Date.now()}_${variantId.slice(0, 8)}`,
      },
      {
        jobId,
        delay,
      },
    );

    this.logger.log(`Scheduled job [${jobId}] for variant ${variantId} with ${Math.round(delay / 1000)}s delay`);
    return job;
  }

  /**
   * Triggers immediate publication with 0 delay
   */
  async publishNow(variantId: string, postId: string, workspaceId: string): Promise<Job> {
    const now = new Date();
    const jobId = `now_${variantId}_${now.getTime()}`;

    // Cancel existing delayed job if rescheduling to publish now
    await this.cancelVariantJob(variantId);

    return this.publishQueue.add(
      'publish-variant',
      {
        variantId,
        postId,
        workspaceId,
        scheduledAt: now.toISOString(),
        immediate: true,
        correlationId: `cid_now_${Date.now()}_${variantId.slice(0, 8)}`,
      },
      {
        jobId,
        delay: 0,
      },
    );
  }

  /**
   * Safely cancels/removes all delayed or waiting jobs for a variant
   */
  async cancelVariantJob(variantId: string): Promise<void> {
    try {
      const jobs = await this.publishQueue.getJobs(['delayed', 'waiting']);
      for (const job of jobs) {
        if (job.data?.variantId === variantId) {
          await job.remove();
          this.logger.log(`Removed pending job [${job.id}] for variant ${variantId}`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not cancel job for variant ${variantId}: ${err.message}`);
    }
  }

  /**
   * Returns queue depth and health metrics
   */
  async getMetrics() {
    try {
      const [waiting, active, delayed, failed, completed] = await Promise.all([
        this.publishQueue.getWaitingCount(),
        this.publishQueue.getActiveCount(),
        this.publishQueue.getDelayedCount(),
        this.publishQueue.getFailedCount(),
        this.publishQueue.getCompletedCount(),
      ]);

      return {
        waiting,
        active,
        delayed,
        failed,
        completed,
        total: waiting + active + delayed + failed,
      };
    } catch {
      return { waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0, total: 0 };
    }
  }
}
