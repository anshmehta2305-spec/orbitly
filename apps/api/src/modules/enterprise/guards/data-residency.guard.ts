import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DataResidencyService } from '../residency/data-residency.service';
import { DataRegion } from '@orbitly/shared';

@Injectable()
export class DataResidencyGuard implements CanActivate {
  constructor(private readonly residencyService: DataResidencyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    if (!workspaceId) return true;

    // Detect server region from environment or request header
    const serverRegion: DataRegion =
      (req.headers['x-orbitly-region'] as DataRegion) ||
      (process.env.SERVER_REGION as DataRegion) ||
      'US';

    await this.residencyService.validateRequestAffinity(workspaceId, serverRegion);
    return true;
  }
}
