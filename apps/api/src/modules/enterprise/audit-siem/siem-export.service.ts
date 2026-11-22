import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { SiemExportConfigInput } from '@orbitly/shared';

@Injectable()
export class SiemExportService {
  /**
   * Format an Orbitly AuditLog record into Splunk HTTP Event Collector (HEC) format
   */
  formatSplunkHec(log: any) {
    const timeSec = Math.floor(new Date(log.createdAt).getTime() / 1000);
    return {
      time: timeSec,
      host: 'orbitly-saas',
      source: 'orbitly:audit_pipeline',
      sourcetype: 'orbitly:audit',
      event: {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        workspaceId: log.workspaceId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadataJson,
        timestamp: log.createdAt,
      },
    };
  }

  /**
   * Format an Orbitly AuditLog record into Datadog Logs API JSON format
   */
  formatDatadogLog(log: any) {
    return {
      ddsource: 'orbitly',
      ddtags: `env:production,workspace:${log.workspaceId || 'global'},action:${log.action}`,
      hostname: 'orbitly-saas',
      service: 'audit-log',
      message: `Audit Action [${log.action}] executed by user ${log.userId || 'system'} on ${log.entityType} (${log.entityId || 'none'})`,
      audit: {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        workspaceId: log.workspaceId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadataJson,
        timestamp: log.createdAt,
      },
    };
  }

  async exportAuditLogs(workspaceId: string, format: 'splunk' | 'datadog', limit: number = 100) {
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (format === 'splunk') {
      return logs.map((l) => this.formatSplunkHec(l));
    } else {
      return logs.map((l) => this.formatDatadogLog(l));
    }
  }

  async testDispatchToSiem(config: SiemExportConfigInput, workspaceId: string): Promise<{ dispatched: number; status: string }> {
    const formattedLogs = await this.exportAuditLogs(workspaceId, config.format, 5);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.format === 'splunk') {
        headers['Authorization'] = `Splunk ${config.token}`;
      } else {
        headers['DD-API-KEY'] = config.token;
      }

      console.log(`📡 [SIEM Dispatch Simulation] Forwarding ${formattedLogs.length} events to ${config.endpointUrl} (${config.format})`);

      return {
        dispatched: formattedLogs.length,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to dispatch to SIEM: ${err.message}`);
    }
  }
}
