import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  prisma,
  Channel,
  ChannelProvider,
  ChannelStatus,
  MembershipRole,
} from '@orbitly/db';
import {
  PLAN_LIMITS,
  PlanTier,
  encryptSecret,
  decryptSecret,
  ConnectedAccount,
  ConnectCredentialsInput,
  UpdateChannelInput,
  ChannelFilterInput,
} from '@orbitly/shared';
import { ProviderRegistry } from '../../providers/registry';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class ChannelsService {
  // Ephemeral OAuth state cache (state -> { workspaceId, providerId, timestamp })
  private oauthStateCache: Map<string, { workspaceId: string; providerId: string; createdAt: number }> =
    new Map();

  constructor(
    private providerRegistry: ProviderRegistry,
    private auditService: AuditService,
  ) {}

  // ----------------------------------------------------
  // Plan Limit Enforcement
  // ----------------------------------------------------
  private async checkChannelPlanLimit(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        subscription: true,
        _count: {
          select: { channels: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const planTier = (workspace.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const limit = PLAN_LIMITS[planTier]?.maxChannels ?? 3;
    const currentCount = workspace._count.channels;

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Workspace has reached the ${limit} channel limit for the ${planTier} tier. Upgrade your subscription to connect more channels.`,
      );
    }
  }

  // ----------------------------------------------------
  // List Channels (Safe metadata only, no raw tokens returned)
  // ----------------------------------------------------
  async listChannels(workspaceId: string, filter?: ChannelFilterInput) {
    const where: any = { workspaceId };
    if (filter?.provider) where.provider = filter.provider;
    if (filter?.status) where.status = filter.status;

    const channels = await prisma.channel.findMany({
      where,
      select: {
        id: true,
        workspaceId: true,
        provider: true,
        accountName: true,
        accountId: true,
        avatar: true,
        status: true,
        color: true,
        timezone: true,
        defaultHashtags: true,
        signature: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { subscription: true },
    });
    const tier = (workspace?.subscription?.planTier as PlanTier) || PlanTier.FREE;
    const maxChannels = PLAN_LIMITS[tier]?.maxChannels ?? 3;

    return {
      channels,
      totalConnected: channels.length,
      planLimit: maxChannels,
      planTier: tier,
    };
  }

  // ----------------------------------------------------
  // Provider Catalog Info
  // ----------------------------------------------------
  listSupportedProviders() {
    return this.providerRegistry.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      authType: p.authType,
      status: p.status,
      capabilities: p.capabilities,
      limits: p.limits,
    }));
  }

  // ----------------------------------------------------
  // Connect with Credentials (Bluesky, Telegram, Discord, Mastodon Token)
  // ----------------------------------------------------
  async connectWithCredentials(
    workspaceId: string,
    userId: string,
    input: ConnectCredentialsInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.checkChannelPlanLimit(workspaceId);

    const providerPlugin = this.providerRegistry.getByChannelProvider(input.provider);
    if (!providerPlugin.connectWithCredentials) {
      throw new BadRequestException(`Provider ${providerPlugin.name} does not support credential connection.`);
    }

    let connected: ConnectedAccount;
    try {
      connected = await providerPlugin.connectWithCredentials(input);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Credential verification failed with platform.');
    }

    // Encrypt sensitive tokens using AES-256-GCM
    const encryptedAccessToken = encryptSecret(connected.accessToken);
    const encryptedRefreshToken = connected.refreshToken
      ? encryptSecret(connected.refreshToken)
      : null;

    // Upsert channel in DB
    const channel = await prisma.channel.upsert({
      where: {
        workspaceId_provider_accountId: {
          workspaceId,
          provider: input.provider,
          accountId: connected.accountId,
        },
      },
      update: {
        accountName: connected.accountName,
        avatar: connected.avatar,
        encryptedAccessToken,
        encryptedRefreshToken,
        status: ChannelStatus.CONNECTED,
        metadataJson: connected.metadata || {},
        lastCheckedAt: new Date(),
      },
      create: {
        workspaceId,
        provider: input.provider,
        accountId: connected.accountId,
        accountName: connected.accountName,
        avatar: connected.avatar,
        encryptedAccessToken,
        encryptedRefreshToken,
        status: ChannelStatus.CONNECTED,
        metadataJson: connected.metadata || {},
        lastCheckedAt: new Date(),
      },
      select: {
        id: true,
        provider: true,
        accountName: true,
        accountId: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // Record audit event
    await this.auditService.log({
      action: 'CHANNEL_CONNECTED',
      entityType: 'CHANNEL',
      entityId: channel.id,
      userId,
      workspaceId,
      metadata: {
        provider: input.provider,
        accountName: connected.accountName,
      },
      ipAddress,
      userAgent,
    });

    return channel;
  }

  // ----------------------------------------------------
  // Start OAuth Flow (Mastodon, X, etc.)
  // ----------------------------------------------------
  async startOAuth(workspaceId: string, providerId: string, instanceUrl?: string) {
    const providerPlugin = this.providerRegistry.get(providerId);
    if (!providerPlugin.getAuthUrl) {
      throw new BadRequestException(`Provider ${providerPlugin.name} does not support OAuth initiation.`);
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/channels/callback/${providerId}`;
    const result = await providerPlugin.getAuthUrl({
      workspaceId,
      callbackUrl,
      instanceUrl,
    });

    // Cache state
    this.oauthStateCache.set(result.state, {
      workspaceId,
      providerId,
      createdAt: Date.now(),
    });

    return result;
  }

  // ----------------------------------------------------
  // Validate Channel Health
  // ----------------------------------------------------
  async validateChannel(workspaceId: string, channelId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId },
    });

    if (!channel) throw new NotFoundException('Channel not found in this workspace.');

    const providerPlugin = this.providerRegistry.getByChannelProvider(channel.provider);
    const decryptedAccessToken = decryptSecret(channel.encryptedAccessToken);
    const decryptedRefreshToken = channel.encryptedRefreshToken
      ? decryptSecret(channel.encryptedRefreshToken)
      : undefined;

    const connectedAccount: ConnectedAccount = {
      accountId: channel.accountId,
      accountName: channel.accountName,
      accessToken: decryptedAccessToken,
      refreshToken: decryptedRefreshToken,
      metadata: (channel.metadataJson as Record<string, any>) || {},
    };

    const validation = await providerPlugin.validate(connectedAccount);

    // Update status
    const newStatus = validation.ok ? ChannelStatus.CONNECTED : ChannelStatus.NEEDS_REAUTH;
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        status: newStatus,
        lastCheckedAt: new Date(),
      },
    });

    return {
      channelId,
      status: newStatus,
      ok: validation.ok,
      reason: validation.reason,
      checkedAt: new Date().toISOString(),
    };
  }

  // ----------------------------------------------------
  // Update Channel Customizations
  // ----------------------------------------------------
  async updateChannel(workspaceId: string, channelId: string, input: UpdateChannelInput) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId },
    });

    if (!channel) throw new NotFoundException('Channel not found in this workspace.');

    return prisma.channel.update({
      where: { id: channelId },
      data: {
        accountName: input.name,
        color: input.color,
        timezone: input.timezone,
        defaultHashtags: input.defaultHashtags,
        signature: input.signature,
        status: input.status,
      },
      select: {
        id: true,
        accountName: true,
        color: true,
        timezone: true,
        defaultHashtags: true,
        signature: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  // ----------------------------------------------------
  // Disconnect Channel
  // ----------------------------------------------------
  async deleteChannel(workspaceId: string, channelId: string, userId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId },
    });

    if (!channel) throw new NotFoundException('Channel not found in this workspace.');

    await prisma.channel.delete({ where: { id: channelId } });

    await this.auditService.log({
      action: 'CHANNEL_DISCONNECTED',
      entityType: 'CHANNEL',
      entityId: channelId,
      userId,
      workspaceId,
      metadata: {
        provider: channel.provider,
        accountName: channel.accountName,
      },
    });

    return { success: true, message: 'Channel successfully disconnected.' };
  }
}
