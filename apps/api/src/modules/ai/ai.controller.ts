import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MembershipRole,
  AiGeneratePostSchema,
  AiRewriteSchema,
  AiIdeasSchema,
  AiRepurposeSchema,
  AiHashtagsSchema,
  AiAltTextSchema,
  AiImageSchema,
  BrandVoiceSchema,
  BrandVoiceSuggestSchema,
} from '@orbitly/shared';

@ApiTags('AI Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller()
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('ai/credits')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get workspace AI credit balance and recent usage' })
  async getCredits(@Headers('x-workspace-id') workspaceId: string) {
    return this.aiService.getCredits(workspaceId);
  }

  @Get('ai/history')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get workspace AI generation history' })
  async getHistory(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<any> {
    return this.aiService.getHistory(workspaceId, limit, offset);
  }

  @Post('ai/generate')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Generate multi-channel tailored social posts' })
  async generatePost(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiGeneratePostSchema.parse(body);
    return this.aiService.generatePost(workspaceId, user.userId, validated);
  }

  @Post('ai/rewrite')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Rewrite text with specific style/action' })
  async rewrite(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiRewriteSchema.parse(body);
    return this.aiService.rewrite(workspaceId, user.userId, validated);
  }

  @Post('ai/ideas')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Generate 10 post ideas + 30-day content calendar' })
  async generateIdeas(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiIdeasSchema.parse(body);
    return this.aiService.generateIdeas(workspaceId, user.userId, validated);
  }

  @Post('ai/repurpose')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Repurpose URL or text into threads, carousels, and snippets' })
  async repurpose(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiRepurposeSchema.parse(body);
    return this.aiService.repurpose(workspaceId, user.userId, validated);
  }

  @Post('ai/hashtags')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Generate categorized hashtag sets' })
  async generateHashtags(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiHashtagsSchema.parse(body);
    return this.aiService.generateHashtags(workspaceId, user.userId, validated);
  }

  @Post('ai/alt-text')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Generate accessible alt text for image' })
  async generateAltText(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiAltTextSchema.parse(body);
    return this.aiService.generateAltText(workspaceId, user.userId, validated);
  }

  @Post('ai/image')
  @RequireRole(MembershipRole.EDITOR)
  @ApiOperation({ summary: 'Generate social media visual image' })
  async generateImage(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = AiImageSchema.parse(body);
    return this.aiService.generateImage(workspaceId, user.userId, validated);
  }

  // Brand Voices
  @Get('brand-voices')
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'List brand voices' })
  async getBrandVoices(@Headers('x-workspace-id') workspaceId: string) {
    return this.aiService.getBrandVoices(workspaceId);
  }

  @Post('brand-voices')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Create brand voice' })
  async createBrandVoice(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ) {
    const validated = BrandVoiceSchema.parse(body);
    return this.aiService.createBrandVoice(workspaceId, validated);
  }

  @Patch('brand-voices/:id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Update brand voice' })
  async updateBrandVoice(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = BrandVoiceSchema.partial().parse(body);
    return this.aiService.updateBrandVoice(workspaceId, id, validated);
  }

  @Delete('brand-voices/:id')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Delete brand voice' })
  async deleteBrandVoice(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.deleteBrandVoice(workspaceId, id);
  }

  @Post('brand-voices/suggest')
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Extract and suggest brand voice traits from sample text' })
  async suggestBrandVoice(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const validated = BrandVoiceSuggestSchema.parse(body);
    return this.aiService.suggestBrandVoice(workspaceId, user.userId, validated.samplePosts);
  }
}
