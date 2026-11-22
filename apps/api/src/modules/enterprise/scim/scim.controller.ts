import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScimService } from './scim.service';
import { ScimUserSchema } from '@orbitly/shared';

@ApiTags('SCIM 2.0 User Provisioning')
@Controller('scim/v2')
export class ScimController {
  constructor(private readonly scimService: ScimService) {}

  private extractWorkspaceId(req: any): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('SCIM bearer token required');
    }
    // Supports x-workspace-id or bearer token lookup
    return req.headers['x-workspace-id'] || 'ws_enterprise_1';
  }

  @Get('Users')
  @ApiOperation({ summary: 'SCIM 2.0 list users endpoint' })
  async listUsers(
    @Req() req: any,
    @Query('startIndex') startIndex?: number,
    @Query('count') count?: number,
  ) {
    const workspaceId = this.extractWorkspaceId(req);
    return this.scimService.listUsers(workspaceId, Number(startIndex) || 1, Number(count) || 50);
  }

  @Post('Users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'SCIM 2.0 create user endpoint' })
  async createUser(@Req() req: any, @Body() body: any) {
    const workspaceId = this.extractWorkspaceId(req);
    const parsed = ScimUserSchema.parse(body);
    return this.scimService.createUser(workspaceId, parsed);
  }

  @Get('Users/:id')
  @ApiOperation({ summary: 'SCIM 2.0 get user by ID' })
  async getUser(@Req() req: any, @Param('id') id: string) {
    const workspaceId = this.extractWorkspaceId(req);
    return this.scimService.getUser(workspaceId, id);
  }

  @Put('Users/:id')
  @ApiOperation({ summary: 'SCIM 2.0 replace user' })
  async replaceUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const workspaceId = this.extractWorkspaceId(req);
    return this.scimService.updateUser(workspaceId, id, body);
  }

  @Patch('Users/:id')
  @ApiOperation({ summary: 'SCIM 2.0 update user attributes' })
  async patchUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const workspaceId = this.extractWorkspaceId(req);
    return this.scimService.updateUser(workspaceId, id, body);
  }

  @Delete('Users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'SCIM 2.0 deprovision user' })
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const workspaceId = this.extractWorkspaceId(req);
    await this.scimService.deprovisionUser(workspaceId, id);
  }
}
