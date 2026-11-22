import { Controller, Get, Post, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { prisma } from '@orbitly/db';

@ApiTags('Email Preferences & Unsubscribe')
@Controller('email')
export class EmailPreferenceController {
  @Get('preferences')
  @ApiOperation({ summary: 'Retrieve email preferences by secure unsubscribe token' })
  async getPreferences(@Query('token') token: string) {
    if (!token) throw new NotFoundException('Token required.');

    const pref = await prisma.emailPreference.findUnique({
      where: { unsubscribeToken: token },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    if (!pref) throw new NotFoundException('Invalid or expired unsubscribe token.');

    return {
      email: pref.user.email,
      marketing: pref.marketing,
      lifecycle: pref.lifecycle,
      weeklyDigest: pref.weeklyDigest,
      unsubscribedAll: Boolean(pref.unsubscribedAllAt),
    };
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update email preferences' })
  async updatePreferences(
    @Query('token') token: string,
    @Body()
    body: {
      marketing: boolean;
      lifecycle: boolean;
      weeklyDigest: boolean;
      unsubscribeAll?: boolean;
    },
  ) {
    if (!token) throw new NotFoundException('Token required.');

    const pref = await prisma.emailPreference.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!pref) throw new NotFoundException('Invalid unsubscribe token.');

    const updated = await prisma.emailPreference.update({
      where: { unsubscribeToken: token },
      data: {
        marketing: body.unsubscribeAll ? false : body.marketing,
        lifecycle: body.unsubscribeAll ? false : body.lifecycle,
        weeklyDigest: body.unsubscribeAll ? false : body.weeklyDigest,
        unsubscribedAllAt: body.unsubscribeAll ? new Date() : null,
      },
    });

    return {
      success: true,
      preferences: {
        marketing: updated.marketing,
        lifecycle: updated.lifecycle,
        weeklyDigest: updated.weeklyDigest,
        unsubscribedAll: Boolean(updated.unsubscribedAllAt),
      },
    };
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'One-click immediate unsubscribe endpoint (CAN-SPAM / RFC 8058)' })
  async oneClickUnsubscribe(@Query('token') token: string) {
    if (!token) throw new NotFoundException('Token required.');

    const pref = await prisma.emailPreference.findUnique({
      where: { unsubscribeToken: token },
      include: { user: { select: { email: true } } },
    });

    if (!pref) throw new NotFoundException('Invalid unsubscribe token.');

    await prisma.emailPreference.update({
      where: { unsubscribeToken: token },
      data: {
        marketing: false,
        lifecycle: false,
        weeklyDigest: false,
        unsubscribedAllAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Successfully unsubscribed ${pref.user.email} from all non-transactional emails.`,
    };
  }
}
