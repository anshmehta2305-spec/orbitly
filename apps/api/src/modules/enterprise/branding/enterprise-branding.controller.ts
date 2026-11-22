import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnterpriseBrandingService } from './enterprise-branding.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EmailDomainVerificationSchema, CustomDomainSslSchema } from '@orbitly/shared';

@ApiTags('Enterprise Branding & Tier Features')
@Controller('enterprise/tier')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnterpriseBrandingController {
  constructor(private readonly brandingService: EnterpriseBrandingService) {}

  @Get('sla-dashboard')
  @ApiOperation({ summary: 'Get enterprise SLA guarantees and rate limit metrics' })
  async getSlaDashboard(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.brandingService.getSlaDashboardMetrics(workspaceId);
  }

  @Post('ssl/provision')
  @ApiOperation({ summary: 'Provision custom domain SSL/TLS certificate' })
  async provisionSsl(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const validated = CustomDomainSslSchema.parse(body);
    return this.brandingService.provisionCustomDomainSsl(workspaceId, validated.customDomain);
  }

  @Post('email-domain/verify')
  @ApiOperation({ summary: 'Verify email sender domain (SPF, DKIM, DMARC)' })
  async verifyEmailDomain(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const validated = EmailDomainVerificationSchema.parse(body);
    return this.brandingService.verifyEmailSenderDomain(workspaceId, validated.emailDomain);
  }
}
