import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { SetSlotsSchema, MembershipRole } from '@orbitly/shared';

@ApiTags('Posting Slots & Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get all recurring posting queue slots' })
  async getSlots(@Query('workspaceId') workspaceId: string, @Query('channelId') channelId?: string) {
    return this.slotsService.getSlots(workspaceId, channelId);
  }

  @Put()
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Set or replace recurring posting slots' })
  async setSlots(@Body() body: any) {
    const validated = SetSlotsSchema.parse(body);
    return this.slotsService.setSlots(validated);
  }

  @Get('next')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Calculate next free posting queue slot' })
  async getNextSlot(@Query('workspaceId') workspaceId: string, @Query('channelId') channelId?: string) {
    return this.slotsService.getNextSlot(workspaceId, channelId);
  }
}
