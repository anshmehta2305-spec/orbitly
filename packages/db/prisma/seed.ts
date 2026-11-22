import { PrismaClient, GlobalRole, MembershipRole, ChannelProvider, ChannelStatus, PostStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Orbitly database seeding...');

  // 1. Create or upsert Demo User
  // Password: Password123!
  // Salt + argon2/sha256 format
  const passwordSalt = 'orbitly_demo_salt';
  const passwordHash = crypto.createHash('sha256').update(`Password123!:${passwordSalt}`).digest('hex');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@orbitly.app' },
    update: {},
    create: {
      email: 'demo@orbitly.app',
      name: 'Sarah Orbit',
      passwordHash: `${passwordHash}:${passwordSalt}`,
      emailVerified: new Date(),
      role: GlobalRole.USER,
      locale: 'en',
      timezone: 'UTC',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  console.log(`👤 Demo User created: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Create Demo Workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'sarah-creatives' },
    update: {},
    create: {
      name: 'Sarah Creatives',
      slug: 'sarah-creatives',
      timezone: 'UTC',
      memberships: {
        create: {
          userId: demoUser.id,
          role: MembershipRole.OWNER,
        },
      },
      subscription: {
        create: {
          customerId: 'cus_demo_sarah_123',
          planTier: 'PRO',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`🏢 Demo Workspace created: ${demoWorkspace.name} (Slug: ${demoWorkspace.slug})`);

  // 3. Connect Sample Social Channels
  const twitterChannel = await prisma.channel.upsert({
    where: {
      workspaceId_provider_accountId: {
        workspaceId: demoWorkspace.id,
        provider: ChannelProvider.X_TWITTER,
        accountId: '123456789_x',
      },
    },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      provider: ChannelProvider.X_TWITTER,
      accountName: '@sarahorbit',
      accountId: '123456789_x',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      encryptedAccessToken: 'mock_encrypted_twitter_access_token',
      encryptedRefreshToken: 'mock_encrypted_twitter_refresh_token',
      tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: ChannelStatus.CONNECTED,
    },
  });

  const linkedinChannel = await prisma.channel.upsert({
    where: {
      workspaceId_provider_accountId: {
        workspaceId: demoWorkspace.id,
        provider: ChannelProvider.LINKEDIN,
        accountId: 'linkedin_urn_987654',
      },
    },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      provider: ChannelProvider.LINKEDIN,
      accountName: 'Sarah Orbit (Creator)',
      accountId: 'linkedin_urn_987654',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      encryptedAccessToken: 'mock_encrypted_linkedin_access_token',
      encryptedRefreshToken: 'mock_encrypted_linkedin_refresh_token',
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: ChannelStatus.CONNECTED,
    },
  });

  const blueskyChannel = await prisma.channel.upsert({
    where: {
      workspaceId_provider_accountId: {
        workspaceId: demoWorkspace.id,
        provider: ChannelProvider.BLUESKY,
        accountId: 'did:plc:mockorbitlysarah',
      },
    },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      provider: ChannelProvider.BLUESKY,
      accountName: 'sarah.bsky.social',
      accountId: 'did:plc:mockorbitlysarah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      encryptedAccessToken: 'mock_encrypted_bluesky_token',
      status: ChannelStatus.CONNECTED,
    },
  });

  console.log(`📡 Sample Channels connected: X/Twitter, LinkedIn, Bluesky`);

  // 4. Create Sample Posts & Variants
  const samplePost = await prisma.post.create({
    data: {
      workspaceId: demoWorkspace.id,
      authorId: demoUser.id,
      title: 'Excited to announce Orbitly Launch 🚀',
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 3600 * 1000 * 4), // 4 hours in future
      campaign: 'Launch Week',
      variants: {
        create: [
          {
            channelId: twitterChannel.id,
            content: 'We are thrilled to launch Orbitly today! 🪐 Plan once, publish everywhere. Say goodbye to multi-tab social publishing. #SaaS #ContentCreator',
            status: PostStatus.SCHEDULED,
          },
          {
            channelId: linkedinChannel.id,
            content: 'Excited to unveil Orbitly to our professional community! Built for modern marketing teams, creators, and agencies to streamline social workflows from a unified command center.\n\nCheck out how we simplify cross-platform scheduling today!',
            firstComment: 'Drop any questions below — our team is active all day!',
            status: PostStatus.SCHEDULED,
          },
          {
            channelId: blueskyChannel.id,
            content: 'Hello Bluesky! 🦋 We just launched Orbitly. Plan once, publish everywhere across your decentralized and classic social channels.',
            status: PostStatus.SCHEDULED,
          },
        ],
      },
    },
  });

  console.log(`📝 Sample Post created: "${samplePost.title}" with 3 variants`);
  console.log('✅ Orbitly Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
