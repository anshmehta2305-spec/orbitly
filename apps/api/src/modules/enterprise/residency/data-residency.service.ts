import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import {
  DataRegion,
  REGIONAL_SPECS,
  getRegionalDatabaseUrl,
  getRegionalRedisConfig,
  getRegionalStorageBucket,
  getRegionalQueueName,
  validateRegionIsolation,
} from '@orbitly/shared';

@Injectable()
export class DataResidencyService {
  /**
   * Retrieves data residency and regional routing configuration for a workspace
   */
  async getWorkspaceRegion(workspaceId: string): Promise<{
    workspaceId: string;
    region: DataRegion;
    endpoints: any;
    dedicatedEgressIpPool: string[];
  }> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        region: true,
        dedicatedEgressIpPool: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace '${workspaceId}' not found`);
    }

    const region = (workspace.region as DataRegion) || 'US';
    const spec = REGIONAL_SPECS[region];

    return {
      workspaceId: workspace.id,
      region,
      endpoints: {
        databaseUrl: getRegionalDatabaseUrl(region),
        redisConfig: getRegionalRedisConfig(region),
        storage: getRegionalStorageBucket(region),
        queuePrefix: spec.queuePrefix,
        regionalEgressIps: spec.egressIpRange,
      },
      dedicatedEgressIpPool:
        workspace.dedicatedEgressIpPool.length > 0 ? workspace.dedicatedEgressIpPool : spec.egressIpRange,
    };
  }

  /**
   * Updates workspace data residency region (US or EU)
   */
  async setWorkspaceRegion(
    workspaceId: string,
    region: DataRegion,
    dedicatedEgressIps?: string[],
  ): Promise<any> {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        region: region as any,
        dedicatedEgressIpPool: dedicatedEgressIps || undefined,
      },
      select: {
        id: true,
        region: true,
        dedicatedEgressIpPool: true,
      },
    });

    return updated;
  }

  /**
   * Enforces strict EU data isolation:
   * Throws ForbiddenException if an EU workspace request is routed to a non-EU server.
   */
  async validateRequestAffinity(workspaceId: string, currentServerRegion: DataRegion): Promise<boolean> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { region: true },
    });

    if (!workspace) return true;

    const workspaceRegion = (workspace.region as DataRegion) || 'US';
    const check = validateRegionIsolation(workspaceRegion, currentServerRegion);

    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    return true;
  }
}
