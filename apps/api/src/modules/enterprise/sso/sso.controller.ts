import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SsoService } from './sso.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SsoConfigSchema } from '@orbitly/shared';

@ApiTags('Enterprise SSO')
@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workspace SSO configuration' })
  async getConfig(@Req() req: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    return this.ssoService.getSsoConfig(workspaceId);
  }

  @Post('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure SAML 2.0 or OIDC enterprise SSO' })
  async configureSso(@Req() req: any, @Body() body: any) {
    const workspaceId = req.headers['x-workspace-id'] || req.user?.currentWorkspaceId;
    const validated = SsoConfigSchema.parse(body);
    return this.ssoService.configureSso(workspaceId, validated);
  }

  @Get('login')
  @ApiOperation({ summary: 'Initiate IdP redirect for enterprise SSO' })
  async initiateIdpLogin(@Query('domain') domain: string) {
    return this.ssoService.generateIdpLoginUrl(domain);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Process SAML assertion or OIDC auth code' })
  async handleCallback(@Body() body: any) {
    return this.ssoService.processSsoCallback(body);
  }
}
