// All trip dates and scheduled times are judged in Osaka local time
// (Asia/Tokyo), regardless of the device time zone.

export const TRIP_TIME_ZONE = "Asia/Tokyo";

export type LocalNow = {
  /** YYYY-MM-DD in Asia/Tokyo */
  date: string;
  /** HH:MM (24h) in Asia/Tokyo */
  time: string;
};

export function toTokyoNow(instant: Date): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

const DAY_MS = 86_400_000;

function toUtcMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (to - from). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtcMs(value));
}

/** "11월 20일 (금)" */
export function formatKoreanDate(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(toUtcMs(date)));
}
