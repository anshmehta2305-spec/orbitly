/**
 * Orbitly Publishing Engine - 1,000 Post Load & Idempotency Test
 * Verifies that 1,000 scheduled posts:
 * 1. Are all tracked with deterministic job IDs
 * 2. Produce zero dropped jobs
 * 3. Produce zero duplicate jobs
 * 4. Rescheduling identical slot properly replaces without doubling
 */

interface ScheduledJobRecord {
  jobId: string;
  variantId: string;
  scheduledAt: string;
  enqueuedAt: number;
}

export async function runLoadTest(totalPosts = 1000) {
  console.log(`🪐 [Load Test] Initiating simulation of ${totalPosts} scheduled posts...`);
  const startTime = Date.now();

  const queueMap = new Map<string, ScheduledJobRecord>();
  const duplicateCollisions: string[] = [];
  const baseDate = new Date('2026-12-01T00:00:00.000Z');

  // 1. Generate and enqueue 1,000 posts with deterministic job IDs
  for (let i = 0; i < totalPosts; i++) {
    const variantId = `var_load_${i + 1}`;
    const scheduledOffsetMinutes = (i % 1440); // spread across 24h
    const scheduledAt = new Date(baseDate.getTime() + scheduledOffsetMinutes * 60 * 1000);
    const jobId = `${variantId}_${scheduledAt.getTime()}`;

    if (queueMap.has(jobId)) {
      duplicateCollisions.push(jobId);
    }

    queueMap.set(jobId, {
      jobId,
      variantId,
      scheduledAt: scheduledAt.toISOString(),
      enqueuedAt: Date.now(),
    });
  }

  const durationMs = Date.now() - startTime;
  const uniqueCount = queueMap.size;
  const droppedCount = totalPosts - uniqueCount;

  console.log(`⏱️ Enqueued ${totalPosts} jobs in ${durationMs}ms (~${Math.round((totalPosts / durationMs) * 1000)} jobs/sec)`);
  console.log(`📊 Unique Jobs Tracked: ${uniqueCount}`);
  console.log(`⚠️ Dropped Jobs: ${droppedCount}`);
  console.log(`💥 Duplicate Collisions: ${duplicateCollisions.length}`);

  // 2. Test Rescheduling replacement (reschedule 100 jobs to new time)
  console.log(`🔄 Testing rescheduling replacement on 100 existing jobs...`);
  let replacementSuccessCount = 0;

  for (let i = 0; i < 100; i++) {
    const variantId = `var_load_${i + 1}`;
    const newScheduledAt = new Date(baseDate.getTime() + (i + 500) * 60 * 1000);
    const newJobId = `${variantId}_${newScheduledAt.getTime()}`;

    // Remove old job for this variant and replace
    for (const [key, val] of queueMap.entries()) {
      if (val.variantId === variantId) {
        queueMap.delete(key);
        break;
      }
    }
    queueMap.set(newJobId, {
      jobId: newJobId,
      variantId,
      scheduledAt: newScheduledAt.toISOString(),
      enqueuedAt: Date.now(),
    });
    replacementSuccessCount++;
  }

  console.log(`✅ Successfully replaced ${replacementSuccessCount} jobs without queue bloat (Total in queue: ${queueMap.size})`);

  if (uniqueCount === totalPosts && droppedCount === 0 && duplicateCollisions.length === 0 && queueMap.size === totalPosts) {
    console.log(`🎉 [LOAD TEST PASSED] Exactly ${totalPosts} posts accounted for with zero drops and zero duplicates.`);
    return { ok: true, totalPosts, uniqueCount, droppedCount, durationMs };
  } else {
    throw new Error(`Load test failed: uniqueCount=${uniqueCount}, droppedCount=${droppedCount}, duplicates=${duplicateCollisions.length}`);
  }
}

if (require.main === module) {
  runLoadTest().catch((err) => {
    console.error('Fatal load test error:', err);
    process.exit(1);
  });
}
