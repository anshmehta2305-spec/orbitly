import { Injectable } from '@nestjs/common';
import { prisma } from '@orbitly/db';

@Injectable()
export class AuditService {
  async log(params: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    workspaceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    try {
      return await prisma.auditLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          userId: params.userId,
          workspaceId: params.workspaceId,
          metadataJson: params.metadata || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('AuditLog creation warning:', error);
      return null;
    }
  }

  async logActivity(params: {
    workspaceId: string;
    postId?: string;
    actorId?: string;
    actorName?: string;
    actorEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    diffJson?: any;
    beforeJson?: any;
    afterJson?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    try {
      return await prisma.activityLog.create({
        data: {
          workspaceId: params.workspaceId,
          postId: params.postId,
          actorId: params.actorId,
          actorName: params.actorName,
          actorEmail: params.actorEmail,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          diffJson: params.diffJson,
          beforeJson: params.beforeJson,
          afterJson: params.afterJson,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('ActivityLog creation warning:', error);
      return null;
    }
  }
}
