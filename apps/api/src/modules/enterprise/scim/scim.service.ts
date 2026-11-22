import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { ScimUserInput } from '@orbitly/shared';

@Injectable()
export class ScimService {
  private formatScimUser(user: any, membership?: any) {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user.id,
      userName: user.email,
      name: {
        formatted: user.name,
        givenName: user.name?.split(' ')[0] || user.name,
        familyName: user.name?.split(' ').slice(1).join(' ') || '',
      },
      displayName: user.name,
      emails: [
        {
          value: user.email,
          primary: true,
          type: 'work',
        },
      ],
      roles: membership ? [membership.role] : ['EDITOR'],
      active: true,
      meta: {
        resourceType: 'User',
        created: user.createdAt,
        lastModified: user.updatedAt,
        location: `https://api.orbitly.io/scim/v2/Users/${user.id}`,
      },
    };
  }

  async listUsers(workspaceId: string, startIndex: number = 1, count: number = 50) {
    const memberships = await prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      skip: Math.max(0, startIndex - 1),
      take: count,
    });

    const totalResults = await prisma.membership.count({
      where: { workspaceId },
    });

    const resources = memberships.map((m) => this.formatScimUser(m.user, m));

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults,
      startIndex,
      itemsPerPage: resources.length,
      Resources: resources,
    };
  }

  async createUser(workspaceId: string, input: ScimUserInput) {
    const email = input.userName.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const name = input.name?.formatted || input.name?.givenName || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: new Date(),
          locale: 'en',
          timezone: 'UTC',
        },
      });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, workspaceId },
    });

    let membership = existingMembership;
    if (!existingMembership) {
      membership = await prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId,
          role: (input.roles?.[0] as any) || 'EDITOR',
        },
      });
    }

    return this.formatScimUser(user, membership);
  }

  async getUser(workspaceId: string, userId: string) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException(`SCIM User with ID '${userId}' not found in workspace.`);
    }

    return this.formatScimUser(membership.user, membership);
  }

  async updateUser(workspaceId: string, userId: string, updateData: any) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException(`SCIM User with ID '${userId}' not found.`);
    }

    let updatedName = membership.user.name;
    if (updateData.name?.formatted) {
      updatedName = updateData.name.formatted;
    } else if (updateData.displayName) {
      updatedName = updateData.displayName;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: updatedName },
    });

    if (updateData.roles?.[0]) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { role: updateData.roles[0] },
      });
    }

    return this.formatScimUser(updatedUser, membership);
  }

  async deprovisionUser(workspaceId: string, userId: string): Promise<boolean> {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId },
    });

    if (!membership) {
      throw new NotFoundException(`SCIM User with ID '${userId}' not found in workspace.`);
    }

    // Delete membership to revoke all access to this workspace
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    return true;
  }
}
