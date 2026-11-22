import { prisma, ChannelStatus } from '@orbitly/db';
import { decryptSecret } from '@orbitly/shared';

export async function runChannelHealthCheck(): Promise<{ checked: number; errors: number }> {
  console.log(`[HealthCheck] 🔍 Starting 6-hour channel validation cycle...`);

  const channels = await prisma.channel.findMany({
    where: {
      status: {
        in: [ChannelStatus.CONNECTED, ChannelStatus.NEEDS_REAUTH],
      },
    },
    include: {
      workspace: true,
    },
  });

  let checkedCount = 0;
  let errorCount = 0;

  for (const channel of channels) {
    checkedCount++;
    try {
      const decryptedToken = decryptSecret(channel.encryptedAccessToken);
      let isValid = true;
      let failureReason: string | undefined;

      // Provider-specific validation check
      if (channel.provider === 'TELEGRAM') {
        const [botToken, chatId] = decryptedToken.split(':::');
        const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const data = await res.json();
        if (!data.ok) {
          isValid = false;
          failureReason = data.description;
        }
      } else if (channel.provider === 'DISCORD') {
        const res = await fetch(decryptedToken);
        if (!res.ok) {
          isValid = false;
          failureReason = `HTTP ${res.status}`;
        }
      }

      if (!isValid) {
        errorCount++;
        console.warn(`[HealthCheck] ⚠️ Channel ${channel.id} (${channel.accountName}) failed validation: ${failureReason}`);

        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            status: ChannelStatus.NEEDS_REAUTH,
            lastCheckedAt: new Date(),
          },
        });

        // Create alert notification in workspace
        const ownerMembership = await prisma.membership.findFirst({
          where: { workspaceId: channel.workspaceId, role: 'OWNER' },
        });

        if (ownerMembership) {
          await prisma.notification.create({
            data: {
              userId: ownerMembership.userId,
              workspaceId: channel.workspaceId,
              title: `Action Required: ${channel.accountName} disconnected`,
              message: `The channel ${channel.accountName} failed validation (${failureReason || 'Auth expired'}). Please re-authenticate to keep publishing schedules active.`,
              type: 'WARNING',
              actionUrl: '/channels',
            },
          });
        }
      } else {
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            status: ChannelStatus.CONNECTED,
            lastCheckedAt: new Date(),
          },
        });
      }
    } catch (err: any) {
      errorCount++;
      console.error(`[HealthCheck] Error checking channel ${channel.id}:`, err.message);
    }
  }

  console.log(`[HealthCheck] ✅ Completed check of ${checkedCount} channels (${errorCount} flagged for re-auth).`);
  return { checked: checkedCount, errors: errorCount };
}
