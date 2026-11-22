import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SignupSchema,
  LoginSchema,
  MagicLinkRequestSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyTwoFactorSchema,
} from '@orbitly/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('orbitly_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    res.cookie('orbitly_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('orbitly_access_token', { path: '/' });
    res.clearCookie('orbitly_refresh_token', { path: '/' });
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account with personal workspace' })
  async signup(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validated = SignupSchema.parse(body);
    const result = await this.authService.signup(validated, req.ip, req.headers['user-agent']);

    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const validated = LoginSchema.parse(body);
    const result = await this.authService.login(validated, req.ip, req.headers['user-agent']);

    if ('requiresTwoFactor' in result) {
      return result;
    }

    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.orbitly_refresh_token || req.body.refreshToken;
    const tokens = await this.authService.refreshTokens(refreshToken, req.ip, req.headers['user-agent']);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request passwordless magic link email' })
  async requestMagicLink(@Body() body: any) {
    const validated = MagicLinkRequestSchema.parse(body);
    return this.authService.requestMagicLink(validated.email);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify magic link token and create session' })
  async verifyMagicLink(
    @Body('token') token: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMagicLink(token, req.ip, req.headers['user-agent']);
    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset link' })
  async forgotPassword(@Body() body: any) {
    const validated = ForgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(validated);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verification token' })
  async resetPassword(@Body() body: any, @Req() req: Request) {
    const validated = ResetPasswordSchema.parse(body);
    return this.authService.resetPassword(validated, req.ip, req.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/setup')
  @ApiOperation({ summary: 'Generate TOTP secret, QR code and recovery backup codes' })
  async setupTwoFactor(@CurrentUser() user: any) {
    return this.authService.setupTwoFactor(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 6-digit TOTP code and enable 2FA' })
  async verifyTwoFactor(@CurrentUser() user: any, @Body() body: any) {
    const validated = VerifyTwoFactorSchema.parse(body);
    return this.authService.verifyAndEnableTwoFactor(user.userId, validated.code);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions for current user' })
  async listSessions(@CurrentUser() user: any) {
    return this.authService.listSessions(user.userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out and invalidate current session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.orbitly_refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate all active sessions across all devices' })
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.userId);
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out of all devices' };
  }
}
