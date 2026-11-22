import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma, GlobalRole, PlatformRole } from '@orbitly/db';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        platformRole: true,
        isDisabled: true,
      },
    });

    if (!dbUser || dbUser.isDisabled) {
      throw new ForbiddenException('User account is disabled or missing');
    }

    const isPlatformAdmin =
      dbUser.role === GlobalRole.SUPERADMIN ||
      dbUser.platformRole === PlatformRole.SUPERADMIN ||
      dbUser.platformRole === PlatformRole.SUPPORT;

    if (!isPlatformAdmin) {
      throw new ForbiddenException({
        code: 'ADMIN_ACCESS_REQUIRED',
        message: 'This resource requires platform administrative privileges (SUPERADMIN or SUPPORT).',
      });
    }

    request.platformUser = dbUser;
    return true;
  }
}
