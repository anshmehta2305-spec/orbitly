import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { PostsModule } from './modules/posts/posts.module';
import { MediaModule } from './modules/media/media.module';
import { SlotsModule } from './modules/slots/slots.module';
import { MembersModule } from './modules/members/members.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { WorkspaceSettingsModule } from './modules/workspace-settings/workspace-settings.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ShareLinksModule } from './modules/share-links/share-links.module';
import { PublicShareModule } from './modules/public-share/public-share.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { BillingModule } from './modules/billing/billing.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { AdminModule } from './modules/admin/admin.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { LifecycleEmailModule } from './modules/lifecycle-emails/lifecycle-email.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { SlackModule } from './modules/integrations/slack/slack.module';
import { AuditService } from './common/services/audit.service';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    WorkspacesModule,
    ChannelsModule,
    PostsModule,
    MediaModule,
    SlotsModule,
    MembersModule,
    InvitationsModule,
    WorkspaceSettingsModule,
    ApprovalsModule,
    CommentsModule,
    ShareLinksModule,
    PublicShareModule,
    AiModule,
    AnalyticsModule,
    AutomationsModule,
    BillingModule,
    PublicApiModule,
    AdminModule,
    OnboardingModule,
    LifecycleEmailModule,
    EnterpriseModule,
    SlackModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AppModule {}
