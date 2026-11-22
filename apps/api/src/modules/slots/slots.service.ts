import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@orbitly/db';
import { SetSlotsInput, calculateNextSlotTime } from '@orbitly/shared';

@Injectable()
export class SlotsService {
  /**
   * Get all slots for workspace or channel
   */
  async getSlots(workspaceId: string, channelId?: string) {
    return prisma.slot.findMany({
      where: {
        workspaceId,
        channelId: channelId || undefined,
      },
      orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
      include: {
        channel: { select: { id: true, provider: true, accountName: true, color: true } },
      },
    });
  }

  /**
   * Set / Replace recurring queue slots
   */
  async setSlots(input: SetSlotsInput) {
    return prisma.$transaction(async (tx) => {
      // Remove existing slots for workspace/channel
      await tx.slot.deleteMany({
        where: {
          workspaceId: input.workspaceId,
          channelId: input.channelId || null,
        },
      });

      // Insert new slots
      if (input.slots.length > 0) {
        await tx.slot.createMany({
          data: input.slots.map((s) => ({
            workspaceId: input.workspaceId,
            channelId: input.channelId || s.channelId || null,
            weekday: s.weekday,
            time: s.time,
            timeUtc: s.time,
            timezone: s.timezone || 'UTC',
          })),
        });
      }

      return tx.slot.findMany({
        where: {
          workspaceId: input.workspaceId,
          channelId: input.channelId || undefined,
        },
        orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
      });
    });
  }

  /**
   * Calculates next available queue slot
   */
  async getNextSlot(workspaceId: string, channelId?: string) {
    const slots = await this.getSlots(workspaceId, channelId);

    if (slots.length === 0) {
      // Default fallback: 1 hour from now
      const fallback = new Date(Date.now() + 60 * 60 * 1000);
      return {
        nextSlotDate: fallback.toISOString(),
        isDefaultFallback: true,
      };
    }

    const now = new Date();
    const candidateDates = slots.map((slot) =>
      calculateNextSlotTime(slot.weekday, slot.time, slot.timezone, now),
    );

    // Pick earliest future slot
    candidateDates.sort((a, b) => a.getTime() - b.getTime());
    const nextSlot = candidateDates[0];

    return {
      nextSlotDate: nextSlot.toISOString(),
      isDefaultFallback: false,
    };
  }
}
