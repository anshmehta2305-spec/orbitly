import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicShareService } from './public-share.service';
import {
  VerifySharePasswordSchema,
  RegisterShareReviewerSchema,
  PublicShareCommentSchema,
  PublicShareDecideSchema,
} from '@orbitly/shared';

@ApiTags('Public Client Share Portal')
@Controller('public/share/:token')
export class PublicShareController {
  constructor(private publicShareService: PublicShareService) {}

  @Get('meta')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'Get client review portal metadata and white-label branding' })
  async getPortalMeta(@Param('token') token: string): Promise<any> {
    return this.publicShareService.getPortalMeta(token);
  }

  @Post('verify-password')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'Verify password with brute-force lockout protection' })
  async verifyPassword(
    @Param('token') token: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = VerifySharePasswordSchema.parse(body);
    return this.publicShareService.verifyPassword(token, validated);
  }

  @Get('posts')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'List scoped posts (whitelisted public fields only)' })
  async listScopedPosts(@Param('token') token: string): Promise<any> {
    return this.publicShareService.listScopedPosts(token);
  }

  @Post('reviewer')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'Register client reviewer identity' })
  async registerReviewer(
    @Param('token') token: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = RegisterShareReviewerSchema.parse(body);
    return this.publicShareService.registerReviewer(token, validated);
  }

  @Post('posts/:postId/comments')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'Add a client review comment' })
  async createClientComment(
    @Param('token') token: string,
    @Param('postId') postId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = PublicShareCommentSchema.parse(body);
    return this.publicShareService.createClientComment(token, postId, validated);
  }

  @Post('posts/:postId/decide')
  @Header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  @Header('Cache-Control', 'no-store, max-age=0')
  @ApiOperation({ summary: 'Client approve or request changes on post' })
  async clientDecide(
    @Param('token') token: string,
    @Param('postId') postId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = PublicShareDecideSchema.parse(body);
    return this.publicShareService.clientDecide(token, postId, validated);
  }
}
