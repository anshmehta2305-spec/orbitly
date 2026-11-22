import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma, MembershipRole } from '@orbitly/db';
import {
  CreateWorkspaceInput,
  RenameWorkspaceInput,
  InviteMemberInput,
} from '@orbitly/shared';
import * as crypto from 'crypto';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class WorkspacesService {
  constructor(private auditService: AuditService) {}

  async listUserWorkspaces(userId: string) {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            subscription: true,
            _count: {
              select: {
                memberships: true,
                channels: true,
                posts: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        timezone: input.timezone || 'UTC',
        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
          },
        },
        subscription: {
          create: {
            customerId: `cus_free_${Math.random().toString(36).substring(2, 9)}`,
            planTier: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });

    await this.auditService.log({
      action: 'WORKSPACE_CREATE',
      entityType: 'WORKSPACE',
      entityId: workspace.id,
      userId,
      workspaceId: workspace.id,
      metadata: { name: input.name, slug },
    });

    return workspace;
  }

  async renameWorkspace(workspaceId: string, userId: string, input: RenameWorkspaceInput) {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name },
    });

    await this.auditService.log({
      action: 'WORKSPACE_RENAME',
      entityType: 'WORKSPACE',
      entityId: workspaceId,
      userId,
      workspaceId,
      metadata: { newName: input.name },
    });

    return updated;
  }

  async inviteMember(workspaceId: string, invitedById: string, input: InviteMemberInput) {
    const email = input.email.toLowerCase();

    // Check if user is already a member
    const existingMembership = await prisma.membership.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    });

    if (existingMembership) {
      throw new ConflictException('This user is already a member of this workspace');
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: input.role as any,
        token,
        expires,
        invitedById,
      },
      include: {
        workspace: true,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitation/accept?token=${token}`;
    console.log(`✉️ [Mailpit Dispatch] Workspace invitation for ${email} to join ${invitation.workspace.name}: ${inviteLink}`);

    await this.auditService.log({
      action: 'TEAM_INVITE_SENT',
      entityType: 'INVITATION',
      entityId: invitation.id,
      userId: invitedById,
      workspaceId,
      metadata: { email, role: input.role },
    });

    return {
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
      token, // Returned for dev and testing
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid or does not exist');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.expires < new Date()) {
      throw new BadRequestException('This invitation has expired (valid for 7 days)');
    }

    // Create or update membership
    const membership = await prisma.membership.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    });

    // Mark invitation accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    await this.auditService.log({
      action: 'TEAM_INVITE_ACCEPTED',
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      userId,
      workspaceId: invitation.workspaceId,
      metadata: { role: invitation.role },
    });

    return {
      success: true,
      workspace: invitation.workspace,
      membership,
    };
  }

  async listMembers(workspaceId: string) {
    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
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

    return {
      members,
      pendingInvitations,
    };
  }
}
