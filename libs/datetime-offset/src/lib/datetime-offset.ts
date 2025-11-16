export type DateTimeOffsetString = string;

const PACIFIC_TIME_ZONE = 'America/Vancouver';

/**
 * Returns an ISO 8601 string with offset in the Vancouver timezone.
 */
export function toPacificDateTimeOffset(date: Date = new Date()): DateTimeOffsetString {
  const { dateTime, offsetMinutes } = formatWithOffset(date);
  return `${dateTime}${formatOffset(offsetMinutes)}`;
}

/**
 * Parses a DateTimeOffset string back into a Date.
 */
export function fromDateTimeOffset(value: DateTimeOffsetString): Date {
  return new Date(value);
}

/**
 * Returns the current timestamp as a DateTimeOffset string.
 */
export function nowPacificDateTimeOffset(): DateTimeOffsetString {
  return toPacificDateTimeOffset();
}

/**
 * Converts a timestamp string back into epoch milliseconds.
 */
export function toEpochMillis(value: DateTimeOffsetString): number {
  return fromDateTimeOffset(value).getTime();
}

function formatWithOffset(date: Date): { dateTime: string; offsetMinutes: number } {
  const pacificFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = pacificFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const fractional = date.getMilliseconds().toString().padStart(3, '0');

  const dateTime = `${lookup['year']}-${lookup['month']}-${lookup['day']}T${lookup['hour']}:${lookup['minute']}:${lookup['second']}.${fractional}`;

  // Offset in minutes relative to UTC
  const interpretedAsUtc = Date.UTC(
    Number(lookup['year']),
    Number(lookup['month']) - 1,
    Number(lookup['day']),
    Number(lookup['hour']),
    Number(lookup['minute']),
    Number(lookup['second']),
    Number(fractional)
  );

  const diffMinutes = Math.round((date.getTime() - interpretedAsUtc) / 60000);
  const offsetMinutes = -diffMinutes;

  return { dateTime, offsetMinutes };
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}
