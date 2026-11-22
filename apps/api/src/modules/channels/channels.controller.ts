import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ConnectCredentialsSchema,
  UpdateChannelSchema,
  ChannelFilterSchema,
  MembershipRole,
} from '@orbitly/shared';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List all supported platform providers and their live status' })
  listProviders() {
    return this.channelsService.listSupportedProviders();
  }

  @Get()
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List all connected channels in the workspace' })
  async listChannels(
    @Query('workspaceId') workspaceId: string,
    @Query() query: any,
  ) {
    const filter = ChannelFilterSchema.parse(query);
    return this.channelsService.listChannels(workspaceId, filter);
  }

  @Post('connect/credentials')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Connect channel via direct credentials (Bluesky, Telegram, Discord, Mastodon)' })
  async connectCredentials(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const validated = ConnectCredentialsSchema.parse(body);
    return this.channelsService.connectWithCredentials(
      workspaceId,
      user.userId,
      validated,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('connect/:provider/start')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Initiate OAuth authorization URL for target provider' })
  async startOAuth(
    @Query('workspaceId') workspaceId: string,
    @Param('provider') providerId: string,
    @Query('instanceUrl') instanceUrl?: string,
  ) {
    return this.channelsService.startOAuth(workspaceId, providerId, instanceUrl);
  }

  @Post(':id/validate')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate channel connection health and credentials' })
  async validateChannel(
    @Query('workspaceId') workspaceId: string,
    @Param('id') channelId: string,
  ) {
    return this.channelsService.validateChannel(workspaceId, channelId);
  }

  @Patch(':id')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Update channel customizations (name, color, timezone, default hashtags, status)' })
  async updateChannel(
    @Query('workspaceId') workspaceId: string,
    @Param('id') channelId: string,
    @Body() body: any,
  ) {
    const validated = UpdateChannelSchema.parse(body);
    return this.channelsService.updateChannel(workspaceId, channelId, validated);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect and delete channel from workspace' })
  async deleteChannel(
    @Query('workspaceId') workspaceId: string,
    @Param('id') channelId: string,
    @CurrentUser() user: any,
  ) {
    return this.channelsService.deleteChannel(workspaceId, channelId, user.userId);
  }
}
