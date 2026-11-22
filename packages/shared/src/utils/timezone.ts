/**
 * Orbitly Timezone & Scheduling Utility
 * Handles cross-timezone conversion, fractional offsets (e.g. Asia/Kolkata +05:30),
 * Daylight Saving Time (DST) edge cases, and recurring queue slot resolution.
 */

export interface FormattedDateTime {
  year: number;
  month: number; // 1 - 12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Extracts date parts in a target timezone using standard Intl API.
 */
export function getDatePartsInTimezone(date: Date, timezone: string): FormattedDateTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: partMap.year,
    month: partMap.month,
    day: partMap.day,
    hour: partMap.hour === 24 ? 0 : partMap.hour,
    minute: partMap.minute,
    second: partMap.second,
  };
}

/**
 * Gets exact timezone offset in minutes for a given date in target timezone.
 * Handles DST shifts automatically.
 */
export function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  const parts = getDatePartsInTimezone(date, timezone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return (localAsUtc - date.getTime()) / (60 * 1000);
}

/**
 * Converts local date string (YYYY-MM-DD) and time (HH:MM) in a target timezone into an exact UTC Date.
 * Properly calculates fractional offsets (e.g., IST +05:30) and DST boundaries.
 */
export function localToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minuteStr] = timeStr.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Initial estimate assuming UTC
  let estimatedUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Determine the timezone's offset for this estimated time
  const offsetMinutes = getTimezoneOffsetMinutes(estimatedUtc, timezone);

  // Correct by subtracting the offset
  const correctedTimestamp = estimatedUtc.getTime() - offsetMinutes * 60 * 1000;
  const correctedDate = new Date(correctedTimestamp);

  // Double check offset around DST shift
  const finalOffset = getTimezoneOffsetMinutes(correctedDate, timezone);
  if (finalOffset !== offsetMinutes) {
    const refinedTimestamp = estimatedUtc.getTime() - finalOffset * 60 * 1000;
    return new Date(refinedTimestamp);
  }

  return correctedDate;
}

/**
 * Formats a UTC Date to "YYYY-MM-DD" and "HH:MM" in a target timezone.
 */
export function utcToLocal(utcDate: Date, timezone: string): { dateStr: string; timeStr: string } {
  const parts = getDatePartsInTimezone(utcDate, timezone);
  const yyyy = parts.year.toString();
  const mm = parts.month.toString().padStart(2, '0');
  const dd = parts.day.toString().padStart(2, '0');
  const hh = parts.hour.toString().padStart(2, '0');
  const min = parts.minute.toString().padStart(2, '0');

  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`,
  };
}

/**
 * Resolves the next occurrence of a recurring slot (weekday 0-6 and time HH:MM)
 * after a specified reference date (defaults to now).
 */
export function calculateNextSlotTime(
  targetWeekday: number, // 0 = Sun, 1 = Mon ... 6 = Sat
  timeStr: string, // "14:30"
  timezone: string,
  afterDate: Date = new Date(),
): Date {
  // Check up to 14 days ahead to find next matching slot
  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const candidateBase = new Date(afterDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const candidateParts = getDatePartsInTimezone(candidateBase, timezone);

    // Calculate weekday for candidate date in target timezone
    const dayOfWeek = new Date(Date.UTC(candidateParts.year, candidateParts.month - 1, candidateParts.day)).getUTCDay();

    if (dayOfWeek === targetWeekday) {
      const yyyy = candidateParts.year.toString();
      const mm = candidateParts.month.toString().padStart(2, '0');
      const dd = candidateParts.day.toString().padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const candidateUtc = localToUtc(dateStr, timeStr, timezone);
      if (candidateUtc.getTime() > afterDate.getTime()) {
        return candidateUtc;
      }
    }
  }

  // Fallback to 24 hours ahead
  return new Date(afterDate.getTime() + 24 * 60 * 60 * 1000);
}
