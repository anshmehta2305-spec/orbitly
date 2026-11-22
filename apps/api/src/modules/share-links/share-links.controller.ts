import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShareLinksService } from './share-links.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  CreateShareLinkSchema,
} from '@orbitly/shared';

@ApiTags('Client Share Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('share-links')
export class ShareLinksController {
  constructor(private shareLinksService: ShareLinksService) {}

  @Get()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'List client review share links (Requires ADMIN)' })
  async listShareLinks(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    return this.shareLinksService.listShareLinks(workspaceId);
  }

  @Post()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Create a new client review share link (Requires ADMIN)' })
  async createShareLink(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = CreateShareLinkSchema.parse(body);
    return this.shareLinksService.createShareLink(workspaceId, user.userId, validated);
  }

  @Post(':id/revoke')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Revoke a client review share link immediately (Requires ADMIN)' })
  async revokeShareLink(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') shareLinkId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.shareLinksService.revokeShareLink(workspaceId, shareLinkId, user.userId);
  }

  @Delete(':id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Delete a client review share link (Requires ADMIN)' })
  async deleteShareLink(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') shareLinkId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.shareLinksService.deleteShareLink(workspaceId, shareLinkId, user.userId);
  }
}
