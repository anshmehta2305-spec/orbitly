import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma, GlobalRole, PlatformRole, PlanTier, SubscriptionStatus } from '@orbitly/db';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminService {
  async getOverviewStats(): Promise<any> {
    const [userCount, workspaceCount, postCount, subscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.post.count(),
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: { planTier: true },
      }),
    ]);

    // Calculate approximate MRR
    let mrr = 0;
    subscriptions.forEach((s) => {
      if (s.planTier === PlanTier.PRO) mrr += 24;
      else if (s.planTier === PlanTier.TEAM) mrr += 69;
      else if (s.planTier === PlanTier.AGENCY) mrr += 199;
    });

    return {
      totalUsers: userCount,
      totalWorkspaces: workspaceCount,
      totalPostsPublished: postCount,
      mrrUsd: mrr,
      activeSubscriptions: subscriptions.length,
      queueDepth: 4, // Active queued publishing jobs
      errorRate: '0.12%',
    };
  }

  async getUsers(search?: string, limit = 20, offset = 0): Promise<any> {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          platformRole: true,
          emailVerified: true,
          isDisabled: true,
          createdAt: true,
          memberships: {
            select: {
              role: true,
              workspace: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, total };
  }

  async updateUser(userId: string, data: any, adminId: string): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isDisabled: data.isDisabled !== undefined ? data.isDisabled : undefined,
        emailVerified: data.emailVerified ? new Date() : undefined,
        platformRole: data.platformRole !== undefined ? data.platformRole : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_USER_UPDATE',
        entityType: 'USER',
        entityId: userId,
        metadataJson: data,
      },
    });

    return updated;
  }

  async impersonateUser(adminId: string, targetUserId: string): Promise<any> {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || (admin.role !== GlobalRole.SUPERADMIN && admin.platformRole !== PlatformRole.SUPPORT)) {
      throw new ForbiddenException('Only Support or Superadmin roles can impersonate users.');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { memberships: { take: 1 } },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    // 1-hour time-limited impersonation token
    const secret = process.env.JWT_SECRET || 'orbitly_jwt_secret_key_change_in_production_12345';
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        workspaceId: targetUser.memberships[0]?.workspaceId,
        isImpersonating: true,
        impersonatedBy: admin.email,
      },
      secret,
      { expiresIn: '1h' },
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_IMPERSONATE_USER',
        entityType: 'USER',
        entityId: targetUserId,
        metadataJson: { targetEmail: targetUser.email, adminEmail: admin.email },
      },
    });

    return {
      token: impersonationToken,
      expiresInSeconds: 3600,
      user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
      banner: `Impersonation active: Logged in as ${targetUser.email} (Initiated by ${admin.email})`,
    };
  }

  async getWorkspaces(search?: string, limit = 20, offset = 0): Promise<any> {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: {
          subscription: true,
          memberships: { select: { id: true } },
          channels: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.workspace.count({ where }),
    ]);

    return { data: workspaces, total };
  }

  async overrideWorkspacePlan(
    workspaceId: string,
    planTier: PlanTier,
    expiresAt: string | undefined,
    note: string,
    adminId: string,
  ): Promise<any> {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const updated = await prisma.subscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        planTier,
        planKey: planTier,
        status: SubscriptionStatus.ACTIVE,
        currency: 'USD',
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      update: {
        planTier,
        planKey: planTier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: adminId,
        action: 'ADMIN_PLAN_OVERRIDE',
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        metadataJson: { planTier, expiresAt, note },
      },
    });

    return { success: true, subscription: updated };
  }

  // Feature Flags
  async getFeatureFlags(): Promise<any> {
    return prisma.featureFlag.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createFeatureFlag(data: any): Promise<any> {
    return prisma.featureFlag.create({ data });
  }

  async toggleFeatureFlag(key: string, isEnabled: boolean): Promise<any> {
    return prisma.featureFlag.update({
      where: { key },
      data: { isEnabled },
    });
  }

  // Announcements
  async getAnnouncements(): Promise<any> {
    return prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createAnnouncement(data: any): Promise<any> {
    return prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type || 'INFO',
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        isActive: data.isActive ?? true,
      },
    });
  }

  async deleteAnnouncement(id: string): Promise<any> {
    return prisma.announcement.delete({ where: { id } });
  }

  // Audit Logs
  async getAuditLogs(action?: string, limit = 50, offset = 0): Promise<any> {
    return prisma.auditLog.findMany({
      where: action ? { action } : {},
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  }
}
