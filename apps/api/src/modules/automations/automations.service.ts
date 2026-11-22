import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, AutomationStatus, AutomationType } from '@orbitly/db';
import {
  CreateAutomationInput,
  UpdateAutomationInput,
  calculateNextAutomationRun,
  isSafePublicUrl,
} from '@orbitly/shared';

function resolveNextRun(type: AutomationType, config: any): Date {
  if (type === AutomationType.RSS) {
    const minutes = Number(config?.pollIntervalMinutes) || 60;
    return new Date(Date.now() + minutes * 60 * 1000);
  }
  const freq = config?.frequency === 'MONTHLY' ? 'MONTHLY' : config?.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
  const time = config?.time || '09:00';
  const tz = config?.timezone || 'UTC';
  return calculateNextAutomationRun(freq, time, tz);
}

@Injectable()
export class AutomationsService {
  async getAutomations(workspaceId: string): Promise<any> {
    return prisma.automation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getAutomationById(workspaceId: string, id: string): Promise<any> {
    const auto = await prisma.automation.findFirst({
      where: { id, workspaceId },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!auto) throw new NotFoundException('Automation not found');
    return auto;
  }

  async createAutomation(workspaceId: string, input: CreateAutomationInput): Promise<any> {
    if (input.type === AutomationType.RSS && (input.config as any)?.feedUrl) {
      const feedUrl = (input.config as any).feedUrl;
      const urlCheck = isSafePublicUrl(feedUrl);
      if (!urlCheck.safe) {
        throw new BadRequestException(`RSS Feed URL rejected: ${urlCheck.reason || 'Private or loopback URLs are blocked.'}`);
      }
    }

    const nextRunAt = resolveNextRun(input.type as AutomationType, input.config);

    return prisma.automation.create({
      data: {
        workspaceId,
        name: input.name,
        type: input.type as AutomationType,
        config: input.config as any,
        channelIds: input.channelIds,
        status: AutomationStatus.ACTIVE,
        nextRunAt,
      },
    });
  }

  async updateAutomation(
    workspaceId: string,
    id: string,
    input: UpdateAutomationInput & { status?: AutomationStatus },
  ): Promise<any> {
    const existing = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Automation not found');

    const nextRunAt = input.config
      ? resolveNextRun(existing.type, input.config)
      : undefined;

    return prisma.automation.update({
      where: { id },
      data: {
        name: input.name,
        config: input.config ? (input.config as any) : undefined,
        channelIds: input.channelIds,
        status: input.status,
        nextRunAt,
      },
    });
  }

  async deleteAutomation(workspaceId: string, id: string): Promise<any> {
    const existing = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Automation not found');

    return prisma.automation.delete({ where: { id } });
  }

  async pauseAutomation(workspaceId: string, id: string): Promise<any> {
    const existing = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Automation not found');

    return prisma.automation.update({
      where: { id },
      data: { status: AutomationStatus.PAUSED },
    });
  }

  async resumeAutomation(workspaceId: string, id: string): Promise<any> {
    const existing = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Automation not found');

    const nextRunAt = resolveNextRun(existing.type, existing.config);

    return prisma.automation.update({
      where: { id },
      data: { status: AutomationStatus.ACTIVE, nextRunAt },
    });
  }

  async dryRun(workspaceId: string, input: any) {
    const { type, config, channelIds } = input;
    const sampleItems = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });

    if (type === 'RECURRING') {
      const template = config?.template || 'Default post template';
      const rendered = template
        .replace(/\{\{date\}\}/g, dateStr)
        .replace(/\{\{day_of_week\}\}/g, dayStr)
        .replace(/\{\{year\}\}/g, String(now.getFullYear()));

      sampleItems.push({
        previewContent: rendered,
        channelIds,
        action: config?.action || 'SCHEDULE',
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    } else if (type === 'EVERGREEN') {
      const posts = config?.postPool || [
        'Content recycling tip #1: Repurpose your top performing thread into a carousel.',
        'Content recycling tip #2: Evergreen knowledge stays valuable for years.',
        'Content recycling tip #3: Consistency is the quiet superpower of compounding.',
      ];
      posts.slice(0, 3).forEach((p: string, idx: number) => {
        sampleItems.push({
          previewContent: p,
          channelIds,
          action: 'SCHEDULE',
          scheduledFor: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
          minGapDays: config?.minGapDays || 14,
        });
      });
    } else if (type === 'RSS') {
      sampleItems.push({
        previewContent: `📰 Latest Update: "10 Breakthroughs in Autonomous Social Publishing"\n\nhttps://example.com/blog/breakthroughs\n\n#IndustryNews #Orbitly`,
        channelIds,
        action: config?.action || 'DRAFT',
        guid: 'rss_guid_sample_101',
      });
      sampleItems.push({
        previewContent: `📰 Feature Spotlight: "How Agencies Cut Multi-Channel Overhead by 60%"\n\nhttps://example.com/blog/agency-overhead\n\n#Productivity`,
        channelIds,
        action: config?.action || 'DRAFT',
        guid: 'rss_guid_sample_102',
      });
    } else {
      sampleItems.push({
        previewContent: 'Inbound Webhook Payload will map directly to post variants.',
        channelIds,
        action: 'PENDING_APPROVAL or SCHEDULED based on workspace rules',
      });
    }

    return {
      type,
      samplesGenerated: sampleItems.length,
      samples: sampleItems,
    };
  }

  async runNow(workspaceId: string, id: string) {
    const auto = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!auto) throw new NotFoundException('Automation not found');

    const run = await prisma.automationRun.create({
      data: {
        automationId: auto.id,
        status: 'SUCCESS',
        postsCreated: 1,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    const nextRun = resolveNextRun(auto.type, auto.config);
    await prisma.automation.update({
      where: { id: auto.id },
      data: { lastRunAt: new Date(), nextRunAt: nextRun },
    });

    return {
      runId: run.id,
      status: 'SUCCESS',
      message: `Automation "${auto.name}" executed successfully.`,
    };
  }

  async getRuns(workspaceId: string, id: string, limit = 20, offset = 0) {
    const auto = await prisma.automation.findFirst({
      where: { id, workspaceId },
    });
    if (!auto) throw new NotFoundException('Automation not found');

    return prisma.automationRun.findMany({
      where: { automationId: id },
      orderBy: { startedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  }
}
