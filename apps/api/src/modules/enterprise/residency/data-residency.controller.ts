import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataResidencyService } from './data-residency.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DataRegion } from '@orbitly/shared';

@ApiTags('Enterprise Data Residency')
@Controller('enterprise/residency')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataResidencyController {
  constructor(private readonly residencyService: DataResidencyService) {}

  @Get()
  @ApiOperation({ summary: 'Get workspace data residency region & infrastructure endpoints' })
  async getResidency(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.residencyService.getWorkspaceRegion(workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Configure workspace data residency (US or EU) and dedicated egress IPs' })
  async updateResidency(
    @Req() req: any,
    @Body() body: { region: DataRegion; dedicatedEgressIpPool?: string[] },
  ) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.residencyService.setWorkspaceRegion(workspaceId, body.region, body.dedicatedEgressIpPool);
  }
}
