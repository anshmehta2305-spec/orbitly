import { describe, it, expect } from 'vitest';
import { calculateNextAutomationRun } from '../utils/cron';

describe('Automation Schedule & Next Run Calculations', () => {
  it('calculates next daily run correctly', () => {
    const baseDate = new Date('2026-11-21T08:00:00Z');
    const nextRun = calculateNextAutomationRun('DAILY', '09:00', 'UTC', baseDate);

    expect(nextRun.toISOString()).toBe('2026-11-21T09:00:00.000Z');

    // If time has passed today, next run is tomorrow
    const lateBase = new Date('2026-11-21T10:00:00Z');
    const tomorrowRun = calculateNextAutomationRun('DAILY', '09:00', 'UTC', lateBase);
    expect(tomorrowRun.toISOString()).toBe('2026-11-22T09:00:00.000Z');
  });

  it('calculates weekly run 7 days ahead', () => {
    const baseDate = new Date('2026-11-21T08:00:00Z');
    const nextWeekly = calculateNextAutomationRun('WEEKLY', '09:00', 'UTC', baseDate);

    expect(nextWeekly.getUTCDate()).toBe(28);
  });
});
