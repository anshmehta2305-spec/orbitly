import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, MembershipRole } from '@orbitly/db';
import {
  UpdateMemberRoleInput,
  TransferOwnershipInput,
  PLAN_LIMITS,
  PlanTier,
} from '@orbitly/shared';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class MembersService {
  constructor(private auditService: AuditService) {}

  async listMembers(workspaceId: string): Promise<any> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            createdAt: true,
          },
        },
        channelAccess: {
          include: {
            channel: {
              select: {
                id: true,
                provider: true,
                accountName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expires: true,
        createdAt: true,
      },
    });

    const tier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const planLimit = PLAN_LIMITS[tier] || PLAN_LIMITS[PlanTier.FREE];
    const seatsUsed = members.length;
    const maxSeats = planLimit.maxMembers;

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
        channelAccess: m.channelAccess.map((ca) => ca.channel),
      })),
      pendingInvitations,
      seatUsage: {
        seatsUsed,
        pendingSeats: pendingInvitations.length,
        maxSeats,
        tier,
      },
    };
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    operatorUserId: string,
    input: UpdateMemberRoleInput,
  ): Promise<any> {
    const targetMembership = await prisma.membership.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Owner protection rule: if target is OWNER and new role is not OWNER,
    // ensure there is another OWNER remaining!
    if (targetMembership.role === MembershipRole.OWNER && input.role !== MembershipRole.OWNER) {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId, role: MembershipRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the last Owner of the workspace');
      }
    }

    // Update role
    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role: input.role as any },
    });

    // Update channel access if provided
    if (input.channelIds !== undefined) {
      await prisma.membershipChannel.deleteMany({
        where: { membershipId: memberId },
      });

      if (input.channelIds.length > 0) {
        await prisma.membershipChannel.createMany({
          data: input.channelIds.map((channelId) => ({
            membershipId: memberId,
            channelId,
          })),
        });
      }
    }

    await this.auditService.log({
      action: 'MEMBER_ROLE_UPDATE',
      entityType: 'MEMBERSHIP',
      entityId: memberId,
      userId: operatorUserId,
      workspaceId,
      metadata: { newRole: input.role, channelIds: input.channelIds },
    });

    return updated;
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    operatorUserId: string,
  ): Promise<any> {
    const targetMembership = await prisma.membership.findUnique({
      where: { id: memberId },
    });

    if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // The last Owner cannot be removed
    if (targetMembership.role === MembershipRole.OWNER) {
      const ownerCount = await prisma.membership.count({
        where: { workspaceId, role: MembershipRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last Owner of the workspace');
      }
    }

    await prisma.membership.delete({
      where: { id: memberId },
    });

    await this.auditService.log({
      action: 'MEMBER_REMOVED',
      entityType: 'MEMBERSHIP',
      entityId: memberId,
      userId: operatorUserId,
      workspaceId,
      metadata: { removedUserId: targetMembership.userId, role: targetMembership.role },
    });

    return { success: true, message: 'Member removed successfully' };
  }

  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    input: TransferOwnershipInput,
  ): Promise<any> {
    const currentOwnerMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentOwnerId,
          workspaceId,
        },
      },
    });

    if (!currentOwnerMembership || currentOwnerMembership.role !== MembershipRole.OWNER) {
      throw new ForbiddenException('Only the current Workspace Owner can transfer ownership');
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: input.newOwnerId,
          workspaceId,
        },
      },
    });

    if (!targetMembership) {
      throw new BadRequestException('Target user is not a member of this workspace');
    }

    if (targetMembership.userId === currentOwnerId) {
      throw new BadRequestException('You are already the owner of this workspace');
    }

    // In a transaction, elevate target to OWNER and demote current to ADMIN
    await prisma.$transaction([
      prisma.membership.update({
        where: { id: targetMembership.id },
        data: { role: MembershipRole.OWNER },
      }),
      prisma.membership.update({
        where: { id: currentOwnerMembership.id },
        data: { role: MembershipRole.ADMIN },
      }),
    ]);

    await this.auditService.log({
      action: 'OWNERSHIP_TRANSFERRED',
      entityType: 'WORKSPACE',
      entityId: workspaceId,
      userId: currentOwnerId,
      workspaceId,
      metadata: { previousOwner: currentOwnerId, newOwner: input.newOwnerId },
    });

    return {
      success: true,
      message: 'Workspace ownership transferred successfully',
      newOwnerId: input.newOwnerId,
    };
  }
}
