import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequireRole } from '../../common/decorators/roles.decorator';
import {
  MembershipRole,
  CheckoutSessionSchema,
  CancelSubscriptionSchema,
  CustomerPortalSessionSchema,
} from '@orbitly/shared';
import { BillingProvider } from '@orbitly/db';
import { Request, Response } from 'express';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all public plans, limits, and multi-currency pricing' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('overview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.VIEWER)
  @ApiOperation({ summary: 'Get workspace subscription, usage meters, and invoices' })
  async getOverview(@Headers('x-workspace-id') workspaceId: string): Promise<any> {
    return this.billingService.getWorkspaceBilling(workspaceId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Create Stripe or Razorpay checkout session' })
  async createCheckout(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = CheckoutSessionSchema.parse(body);
    return this.billingService.createCheckout(workspaceId, validated);
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.ADMIN)
  @ApiOperation({ summary: 'Create Stripe Customer Portal session' })
  async createPortal(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = CustomerPortalSessionSchema.parse(body || {});
    return this.billingService.createPortal(workspaceId, validated.returnUrl);
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireRole(MembershipRole.OWNER)
  @ApiOperation({ summary: 'Cancel subscription at period end with feedback reason' })
  async cancelSubscription(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() body: any,
  ): Promise<any> {
    const validated = CancelSubscriptionSchema.parse(body);
    return this.billingService.cancelSubscription(workspaceId, validated);
  }

  // Public webhook listeners
  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook listener' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<any> {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    return this.billingService.handleWebhook(BillingProvider.STRIPE, rawBody, signature);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay webhook listener' })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ): Promise<any> {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    return this.billingService.handleWebhook(BillingProvider.RAZORPAY, rawBody, signature);
  }
}
