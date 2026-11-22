import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole, hasPermission } from '@orbitly/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { prisma } from '@orbitly/db';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<MembershipRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.userId) {
      throw new ForbiddenException('User context is missing');
    }

    // Resolve workspace ID from Header, Param or Query
    const workspaceId =
      request.headers['x-workspace-id'] ||
      request.params.workspaceId ||
      request.params.id ||
      request.query.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context (x-workspace-id) is required for RBAC evaluation');
    }

    // Lookup user's membership in this workspace
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.userId,
          workspaceId: String(workspaceId),
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const permitted = hasPermission(membership.role as MembershipRole, requiredRole);
    if (!permitted) {
      throw new ForbiddenException(`Access denied: Requires at least ${requiredRole} role`);
    }

    request.membership = membership;
    return true;
  }
}
