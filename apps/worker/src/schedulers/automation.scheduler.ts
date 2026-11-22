import { prisma, AutomationStatus, AutomationType, PostStatus } from '@orbitly/db';
import { calculateNextAutomationRun, isSafePublicUrl } from '@orbitly/shared';

export async function runAutomationTick(): Promise<{
  executed: number;
  pausedErrors: number;
}> {
  const now = new Date();
  const activeAutomations = await prisma.automation.findMany({
    where: {
      status: AutomationStatus.ACTIVE,
      nextRunAt: { lte: now },
    },
    include: {
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
      workspace: {
        include: {
          settings: true,
          memberships: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  if (activeAutomations.length === 0) {
    return { executed: 0, pausedErrors: 0 };
  }

  console.log(`[AutomationWorker] ⚡ Found ${activeAutomations.length} automation(s) scheduled for execution.`);

  let executed = 0;
  let pausedErrors = 0;

  for (const auto of activeAutomations) {
    const startedAt = new Date();
    try {
      // Check for 5 consecutive previous failures
      const last5 = auto.runs.slice(0, 5);
      const consecutiveFails = last5.filter((r) => r.status === 'FAILED').length;
      if (last5.length === 5 && consecutiveFails === 5) {
        console.warn(`[AutomationWorker] 🛑 Auto-pausing automation ${auto.id} (${auto.name}) due to 5 consecutive failures.`);
        await prisma.automation.update({
          where: { id: auto.id },
          data: { status: AutomationStatus.PAUSED },
        });
        pausedErrors++;
        continue;
      }

      const config: any = auto.config || {};
      const workspace = auto.workspace;
      const authorId = workspace.memberships[0]?.userId || 'system_author';
      const approvalRequired = workspace.settings?.approvalRequired ?? false;

      let postContent = '';
      let scheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour out by default

      if (auto.type === AutomationType.RECURRING) {
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
        const template = config.template || 'Automated update for {{date}}';

        postContent = template
          .replace(/\{\{date\}\}/g, dateStr)
          .replace(/\{\{day_of_week\}\}/g, dayStr)
          .replace(/\{\{year\}\}/g, String(now.getFullYear()));
      } else if (auto.type === AutomationType.EVERGREEN) {
        const pool = config.postPool || ['Evergreen tip: Consistency compounds into distribution.'];
        const runCount = auto.runs.length;
        const selectedIndex = runCount % pool.length;
        postContent = pool[selectedIndex];
      } else if (auto.type === AutomationType.RSS) {
        if (config.feedUrl && isSafePublicUrl(config.feedUrl).safe) {
          postContent = `📰 Latest: "Weekly Automation Round-up"\n\n${config.feedUrl}\n\n#IndustryUpdates`;
        } else {
          throw new Error('RSS feed URL blocked or invalid (SSRF protection).');
        }
      } else {
        postContent = `Webhook-driven post created at ${now.toISOString()}`;
      }

      const initialStatus: PostStatus = approvalRequired ? PostStatus.PENDING_APPROVAL : PostStatus.SCHEDULED;

      // Create post and variants for selected channels
      await prisma.post.create({
        data: {
          workspaceId: workspace.id,
          authorId,
          status: initialStatus,
          scheduledAt: scheduledTime,
          timezone: 'UTC',
          variants: {
            create: auto.channelIds.map((cId) => ({
              channelId: cId,
              content: postContent,
              status: initialStatus,
            })),
          },
        },
      });

      // Calculate next run
      const freq = config.frequency === 'MONTHLY' ? 'MONTHLY' : config.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
      const time = config.time || '09:00';
      const nextRun = calculateNextAutomationRun(freq, time, 'UTC');

      // Record successful run
      await prisma.automationRun.create({
        data: {
          automationId: auto.id,
          status: 'SUCCESS',
          postsCreated: 1,
          startedAt,
          finishedAt: new Date(),
        },
      });

      await prisma.automation.update({
        where: { id: auto.id },
        data: { lastRunAt: new Date(), nextRunAt: nextRun },
      });

      executed++;
    } catch (err: any) {
      console.error(`[AutomationWorker] ❌ Failed to run automation ${auto.id}: ${err.message}`);

      await prisma.automationRun.create({
        data: {
          automationId: auto.id,
          status: 'FAILED',
          postsCreated: 0,
          error: err.message,
          startedAt,
          finishedAt: new Date(),
        },
      });

      // Retry in 1 hour if failed
      await prisma.automation.update({
        where: { id: auto.id },
        data: { nextRunAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
    }
  }

  return { executed, pausedErrors };
}
