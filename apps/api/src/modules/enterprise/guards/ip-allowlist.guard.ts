import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { isIpAllowed } from '@orbitly/shared';

@Injectable()
export class IpAllowlistGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const workspaceId = req.headers['x-workspace-id'] || user?.currentWorkspaceId;
    if (!workspaceId) return true;

    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings || !settings.ipAllowlist || settings.ipAllowlist.length === 0) {
      return true; // No allowlist restriction configured
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const allowed = isIpAllowed(clientIp, settings.ipAllowlist);
    if (!allowed) {
      throw new ForbiddenException(
        `Access denied: IP address ${clientIp} is not authorized for workspace '${workspaceId}'.`,
      );
    }

    return true;
  }
}
