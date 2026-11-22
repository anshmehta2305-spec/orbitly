import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, ShareScope } from '@orbitly/db';
import {
  CreateShareLinkInput,
  UpdateShareLinkInput,
} from '@orbitly/shared';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class ShareLinksService {
  constructor(private auditService: AuditService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createShareLink(
    workspaceId: string,
    userId: string,
    input: CreateShareLinkInput,
  ): Promise<any> {
    // Generate unguessable 256-bit token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    let passwordHash: string | null = null;
    if (input.password && input.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(input.password, 10);
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const dateFrom = input.dateFrom ? new Date(input.dateFrom) : null;
    const dateTo = input.dateTo ? new Date(input.dateTo) : null;

    const shareLink = await prisma.shareLink.create({
      data: {
        workspaceId,
        createdById: userId,
        name: input.name,
        tokenHash,
        scope: input.scope as any,
        channelIds: input.channelIds || [],
        dateFrom,
        dateTo,
        passwordHash,
        expiresAt,
        allowComments: input.allowComments ?? true,
        allowApprove: input.allowApprove ?? false,
      },
      include: {
        workspace: {
          select: { name: true },
        },
      },
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${rawToken}`;

    await this.auditService.log({
      action: 'SHARE_LINK_CREATED',
      entityType: 'SHARE_LINK',
      entityId: shareLink.id,
      userId,
      workspaceId,
      metadata: { name: input.name, scope: input.scope, hasPassword: !!passwordHash },
    });

    return {
      id: shareLink.id,
      name: shareLink.name,
      scope: shareLink.scope,
      shareUrl: publicUrl,
      rawToken, // Returned once upon creation
      hasPassword: !!passwordHash,
      allowComments: shareLink.allowComments,
      allowApprove: shareLink.allowApprove,
      expiresAt: shareLink.expiresAt,
      createdAt: shareLink.createdAt,
    };
  }

  async listShareLinks(workspaceId: string): Promise<any> {
    const links = await prisma.shareLink.findMany({
      where: { workspaceId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { reviewers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link) => {
      const isExpired = link.expiresAt ? link.expiresAt < new Date() : false;
      const isRevoked = !!link.revokedAt;
      return {
        id: link.id,
        name: link.name,
        scope: link.scope,
        channelIds: link.channelIds,
        hasPassword: !!link.passwordHash,
        allowComments: link.allowComments,
        allowApprove: link.allowApprove,
        expiresAt: link.expiresAt,
        revokedAt: link.revokedAt,
        isActive: !isExpired && !isRevoked,
        viewCount: link.viewCount,
        lastViewedAt: link.lastViewedAt,
        reviewersCount: link._count.reviewers,
        createdBy: link.createdBy,
        createdAt: link.createdAt,
      };
    });
  }

  async revokeShareLink(
    workspaceId: string,
    shareLinkId: string,
    userId: string,
  ): Promise<any> {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
    });

    if (!link || link.workspaceId !== workspaceId) {
      throw new NotFoundException('Share link not found in this workspace');
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.log({
      action: 'SHARE_LINK_REVOKED',
      entityType: 'SHARE_LINK',
      entityId: shareLinkId,
      userId,
      workspaceId,
    });

    return { success: true, message: 'Share link revoked', link: updated };
  }

  async deleteShareLink(
    workspaceId: string,
    shareLinkId: string,
    userId: string,
  ): Promise<any> {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
    });

    if (!link || link.workspaceId !== workspaceId) {
      throw new NotFoundException('Share link not found in this workspace');
    }

    await prisma.shareLink.delete({
      where: { id: shareLinkId },
    });

    await this.auditService.log({
      action: 'SHARE_LINK_DELETED',
      entityType: 'SHARE_LINK',
      entityId: shareLinkId,
      userId,
      workspaceId,
    });

    return { success: true, message: 'Share link deleted' };
  }
}
