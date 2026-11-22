import { describe, it, expect } from 'vitest';
import {
  localToUtc,
  utcToLocal,
  calculateNextSlotTime,
  getTimezoneOffsetMinutes,
} from '../utils/timezone';

describe('Timezone & Scheduling Math', () => {
  it('converts local time in UTC without shift', () => {
    const utcDate = localToUtc('2026-11-21', '14:30', 'UTC');
    expect(utcDate.toISOString()).toBe('2026-11-21T14:30:00.000Z');

    const formatted = utcToLocal(utcDate, 'UTC');
    expect(formatted.dateStr).toBe('2026-11-21');
    expect(formatted.timeStr).toBe('14:30');
  });

  it('correctly handles fractional offset timezones (Asia/Kolkata +05:30)', () => {
    // 15:30 IST on 2026-11-21 is exactly 10:00 UTC
    const istDate = localToUtc('2026-11-21', '15:30', 'Asia/Kolkata');
    expect(istDate.toISOString()).toBe('2026-11-21T10:00:00.000Z');

    const backToIst = utcToLocal(istDate, 'Asia/Kolkata');
    expect(backToIst.dateStr).toBe('2026-11-21');
    expect(backToIst.timeStr).toBe('15:30');

    // Confirm offset is +330 minutes (+5.5 hours)
    const offset = getTimezoneOffsetMinutes(istDate, 'Asia/Kolkata');
    expect(offset).toBe(330);
  });

  it('handles Daylight Saving Time (DST) shift in America/New_York (EDT vs EST)', () => {
    // Summer date (EDT = UTC-4 = -240 mins)
    const summerDate = localToUtc('2026-07-15', '12:00', 'America/New_York');
    expect(summerDate.toISOString()).toBe('2026-07-15T16:00:00.000Z');
    expect(getTimezoneOffsetMinutes(summerDate, 'America/New_York')).toBe(-240);

    // Winter date (EST = UTC-5 = -300 mins)
    const winterDate = localToUtc('2026-01-15', '12:00', 'America/New_York');
    expect(winterDate.toISOString()).toBe('2026-01-15T17:00:00.000Z');
    expect(getTimezoneOffsetMinutes(winterDate, 'America/New_York')).toBe(-300);
  });

  it('resolves the next recurring queue slot', () => {
    // Reference date: Wednesday 2026-11-18 10:00 UTC
    const refDate = new Date('2026-11-18T10:00:00.000Z');

    // Next slot: Friday (weekday 5) at 15:00 UTC
    const nextFridaySlot = calculateNextSlotTime(5, '15:00', 'UTC', refDate);
    expect(nextFridaySlot.getUTCDay()).toBe(5);
    expect(nextFridaySlot.toISOString()).toBe('2026-11-20T15:00:00.000Z');
  });
});