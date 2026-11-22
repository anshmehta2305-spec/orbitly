import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@orbitly/db';

@Injectable()
export class SessionTimeoutGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true;

    const workspaceId = req.headers['x-workspace-id'] || user.currentWorkspaceId;
    if (!workspaceId) return true;

    const settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    const timeoutMinutes = settings?.sessionTimeoutMinutes || 480; // default 8 hours (480 mins)
    const tokenIat = user.iat; // standard JWT issued-at epoch timestamp in seconds

    if (tokenIat) {
      const tokenAgeMinutes = (Date.now() / 1000 - tokenIat) / 60;
      if (tokenAgeMinutes > timeoutMinutes) {
        throw new UnauthorizedException(
          `Your session has timed out per workspace security policy (${timeoutMinutes} minutes). Please re-authenticate.`,
        );
      }
    }

    return true;
  }
}
