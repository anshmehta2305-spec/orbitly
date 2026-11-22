import { Queue } from 'bullmq';
import { prisma, PostStatus } from '@orbitly/db';

/**
 * Sweeper running every minute: detects any scheduled posts past due that
 * were not published (e.g. during worker downtime) and enqueues them immediately.
 */
export async function runMissedScheduleSweeper(publishQueue: Queue): Promise<number> {
  const now = new Date();

  // Find past-due scheduled posts
  const overduePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: { lte: now },
      deletedAt: null,
    },
    include: {
      variants: {
        where: {
          status: { in: [PostStatus.SCHEDULED, PostStatus.DRAFT] },
        },
      },
    },
  });

  let recoveredCount = 0;

  // Check for posts pending approval whose scheduled time has passed
  const expiredPendingPosts = await prisma.post.findMany({
    where: {
      status: PostStatus.PENDING_APPROVAL,
      scheduledAt: { lte: now },
      deletedAt: null,
    },
    include: { author: true },
  });

  for (const post of expiredPendingPosts) {
    // Post cannot publish without approval; mark as missed / needs reschedule
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.DRAFT,
      },
    });

    await prisma.notification.create({
      data: {
        userId: post.authorId,
        workspaceId: post.workspaceId,
        title: 'Scheduled Time Passed While Pending Approval',
        message: 'Your post was not approved before its scheduled time. It has been moved to drafts for rescheduling.',
        type: 'WARNING',
        actionUrl: `/calendar?postId=${post.id}`,
      },
    });

    console.log(`[Sweeper] ⚠️ Post ${post.id} scheduled time passed while still PENDING_APPROVAL. Reverted to DRAFT and notified author.`);
  }

  for (const post of overduePosts) {
    for (const variant of post.variants) {
      const jobId = `recovery_${variant.id}_${now.getTime()}`;

      await publishQueue.add(
        'publish-variant',
        {
          variantId: variant.id,
          postId: post.id,
          workspaceId: post.workspaceId,
          scheduledAt: now.toISOString(),
          recovery: true,
          correlationId: `cid_rec_${Date.now()}_${variant.id.slice(0, 8)}`,
        },
        {
          jobId,
          delay: 0,
        },
      );
      recoveredCount++;
    }
  }

  if (recoveredCount > 0) {
    console.log(`[Sweeper] ⚡ Enqueued ${recoveredCount} overdue post variant(s) for immediate processing.`);
  }

  return recoveredCount;
}
