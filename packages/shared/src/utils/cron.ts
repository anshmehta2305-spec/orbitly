/**
 * Minimal recurring schedule next-run calculator across timezones.
 */

export function calculateNextAutomationRun(
  scheduleType: 'DAILY' | 'WEEKLY' | 'HOURLY' | 'MONTHLY',
  time: string = '09:00', // HH:mm
  timezone: string = 'UTC',
  fromDate: Date = new Date(),
): Date {
  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  const target = new Date(fromDate);

  target.setUTCSeconds(0, 0);

  if (scheduleType === 'HOURLY') {
    target.setUTCHours(target.getUTCHours() + 1);
    target.setUTCMinutes(minutes || 0);
  } else if (scheduleType === 'DAILY') {
    target.setUTCHours(hours || 9, minutes || 0);
    if (target.getTime() <= fromDate.getTime()) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
  } else if (scheduleType === 'WEEKLY') {
    target.setUTCHours(hours || 9, minutes || 0);
    target.setUTCDate(target.getUTCDate() + 7);
  } else if (scheduleType === 'MONTHLY') {
    target.setUTCHours(hours || 9, minutes || 0);
    target.setUTCMonth(target.getUTCMonth() + 1);
  }

  return target;
}
