import { Controller, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SiemExportService } from './siem-export.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SiemExportConfigSchema } from '@orbitly/shared';

@ApiTags('Enterprise Audit SIEM')
@Controller('enterprise/audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SiemExportController {
  constructor(private readonly siemService: SiemExportService) {}

  @Post('export')
  @ApiOperation({ summary: 'Export audit logs in Splunk HEC or Datadog format' })
  async exportLogs(
    @Req() req: any,
    @Query('format') format: 'splunk' | 'datadog' = 'splunk',
    @Query('limit') limit?: number,
  ) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.siemService.exportAuditLogs(workspaceId, format, Number(limit) || 100);
  }

  @Post('test-dispatch')
  @ApiOperation({ summary: 'Test SIEM webhook dispatch (Splunk HEC / Datadog)' })
  async testDispatch(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const config = SiemExportConfigSchema.parse(body);
    return this.siemService.testDispatchToSiem(config, workspaceId);
  }
}
