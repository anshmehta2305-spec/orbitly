import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma, MembershipRole, InvitationStatus } from '@orbitly/db';
import {
  CreateInvitationInput,
  BulkInvitationInput,
  AcceptInvitationInput,
  PLAN_LIMITS,
  PlanTier,
} from '@orbitly/shared';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class InvitationsService {
  constructor(private auditService: AuditService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async assertSeatLimit(workspaceId: string, additionalSeats: number = 1) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const tier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const planLimit = PLAN_LIMITS[tier] || PLAN_LIMITS[PlanTier.FREE];
    const currentCount = workspace._count.memberships;

    const pendingCount = await prisma.invitation.count({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
        expires: { gt: new Date() },
      },
    });

    if (currentCount + pendingCount + additionalSeats > planLimit.maxMembers) {
      throw new BadRequestException(
        `Workspace member seat limit reached for plan tier ${tier} (max ${planLimit.maxMembers} members). Please upgrade your subscription to add more seats.`,
      );
    }
  }

  async createInvitation(
    workspaceId: string,
    invitedById: string,
    input: CreateInvitationInput,
  ): Promise<any> {
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

    await this.assertSeatLimit(workspaceId, 1);

    // Generate unguessable 256-bit token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        role: input.role as any,
        token,
        tokenHash,
        status: InvitationStatus.PENDING,
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
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires: invitation.expires,
        inviteUrl: inviteLink,
      },
      token, // For dev/testing convenience
    };
  }

  async createBulkInvitations(
    workspaceId: string,
    invitedById: string,
    input: BulkInvitationInput,
  ): Promise<any> {
    const uniqueEmails = Array.from(new Set(input.emails.map((e) => e.toLowerCase())));
    await this.assertSeatLimit(workspaceId, uniqueEmails.length);

    const created: any[] = [];
    const skipped: string[] = [];

    for (const email of uniqueEmails) {
      const existing = await prisma.membership.findFirst({
        where: { workspaceId, user: { email } },
      });
      if (existing) {
        skipped.push(email);
        continue;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const inv = await prisma.invitation.create({
        data: {
          workspaceId,
          email,
          role: input.role as any,
          token,
          tokenHash,
          status: InvitationStatus.PENDING,
          expires,
          invitedById,
        },
      });

      created.push({ id: inv.id, email, token });
    }

    return {
      success: true,
      sentCount: created.length,
      skippedCount: skipped.length,
      skipped,
      created,
    };
  }

  async resendInvitation(
    workspaceId: string,
    invitationId: string,
    operatorUserId: string,
  ): Promise<any> {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { workspace: true },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token,
        tokenHash,
        status: InvitationStatus.PENDING,
        expires,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitation/accept?token=${token}`;
    console.log(`✉️ [Mailpit Dispatch] Resent workspace invitation to ${updated.email}: ${inviteLink}`);

    await this.auditService.log({
      action: 'TEAM_INVITE_RESENT',
      entityType: 'INVITATION',
      entityId: updated.id,
      userId: operatorUserId,
      workspaceId,
      metadata: { email: updated.email },
    });

    return {
      success: true,
      message: 'Invitation resent successfully',
      inviteUrl: inviteLink,
      token,
    };
  }

  async revokeInvitation(
    workspaceId: string,
    invitationId: string,
    operatorUserId: string,
  ): Promise<any> {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });

    await this.auditService.log({
      action: 'TEAM_INVITE_REVOKED',
      entityType: 'INVITATION',
      entityId: invitationId,
      userId: operatorUserId,
      workspaceId,
    });

    return { success: true, message: 'Invitation revoked successfully' };
  }

  async acceptInvitation(input: AcceptInvitationInput, authUserId?: string): Promise<any> {
    const tokenHash = this.hashToken(input.token);

    // Find invitation by token or tokenHash
    const invitation = await prisma.invitation.findFirst({
      where: {
        OR: [{ token: input.token }, { tokenHash }],
      },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid');
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new BadRequestException('This invitation has been revoked by workspace admin');
    }

    if (invitation.status === InvitationStatus.ACCEPTED || invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.expires < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired (valid for 7 days)');
    }

    let resolvedUserId = authUserId;

    // If no authenticated user, resolve or create user by invitation email
    if (!resolvedUserId) {
      let existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (!existingUser) {
        if (!input.password) {
          throw new BadRequestException('Password is required to create a new user account');
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        existingUser = await prisma.user.create({
          data: {
            email: invitation.email,
            name: input.name || invitation.email.split('@')[0],
            passwordHash,
            emailVerified: new Date(),
          },
        });
      }
      resolvedUserId = existingUser.id;
    }

    // Verify seat limit at accept time
    await this.assertSeatLimit(invitation.workspaceId, 0);

    const membership = await prisma.membership.upsert({
      where: {
        userId_workspaceId: {
          userId: resolvedUserId,
          workspaceId: invitation.workspaceId,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        userId: resolvedUserId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    await this.auditService.log({
      action: 'TEAM_INVITE_ACCEPTED',
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      userId: resolvedUserId,
      workspaceId: invitation.workspaceId,
      metadata: { role: invitation.role },
    });

    return {
      success: true,
      message: 'Invitation accepted successfully',
      workspace: invitation.workspace,
      membership,
    };
  }
}
