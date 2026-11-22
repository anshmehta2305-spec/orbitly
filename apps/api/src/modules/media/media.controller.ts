import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { PresignMediaSchema, CompleteMediaSchema, MembershipRole } from '@orbitly/shared';

@ApiTags('Media Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Generate S3/MinIO presigned upload URL' })
  async presignUpload(@Body() body: any) {
    const validated = PresignMediaSchema.parse(body);
    return this.mediaService.presignUpload(validated);
  }

  @Post('complete')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Complete and record media upload metadata' })
  async completeUpload(@Body() body: any) {
    const validated = CompleteMediaSchema.parse(body);
    return this.mediaService.completeUpload(validated);
  }

  @Get()
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List workspace media assets' })
  async listMedia(@Query('workspaceId') workspaceId: string, @Query('folder') folder?: string) {
    return this.mediaService.listMedia(workspaceId, folder);
  }
}
