import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MembershipRole, CreateApiKeySchema, generateApiKey } from '@orbitly/shared';
import { prisma } from '@orbitly/db';

@ApiTags('Developer Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('api-keys')
export class DeveloperSettingsController {
  @Get()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'List workspace API keys' })
  async listKeys(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        createdBy: true,
        ipAllowlist: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    return { data: keys };
  }

  @Post()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Generate a new scoped API Key (Raw key returned ONCE)' })
  async createKey(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ): Promise<any> {
    const validated = CreateApiKeySchema.parse(body);

    const generated = generateApiKey('orb_live');

    const key = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: validated.name,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        scopes: validated.scopes,
        createdBy: user?.email || user?.userId || 'admin',
        ipAllowlist: validated.ipAllowlist || [],
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      },
    });

    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      rawKey: generated.rawKey, // RETURNED ONLY ONCE
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      message: 'Store this raw API key safely now. You will never be able to view it again.',
    };
  }

  @Delete(':id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Revoke an API key immediately' })
  async revokeKey(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    const existing = await prisma.apiKey.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('API Key not found');

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return { success: true, revokedAt: updated.revokedAt };
  }
}
