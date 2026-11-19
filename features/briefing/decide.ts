export type BriefingKind = "morning" | "evening";

/** Osaka local time from which the evening briefing shows. Easy-to-change default. */
export const EVENING_FROM = "20:00";

export type BriefingInput = {
  nowTime: string;
  todayIsTripDay: boolean;
  tomorrowIsTripDay: boolean;
  dismissedToday: Record<BriefingKind, boolean>;
};

/**
 * Which briefing to show first when the trip screen opens, if any.
 * Morning shows on any trip day until confirmed, whatever the hour.
 * Evening shows from 20:00 when tomorrow is a trip day (including the eve of day 1).
 */
export function decideBriefing(input: BriefingInput): BriefingKind | null {
  if (input.todayIsTripDay && !input.dismissedToday.morning) return "morning";
  if (
    input.tomorrowIsTripDay &&
    input.nowTime >= EVENING_FROM &&
    !input.dismissedToday.evening
  ) {
    return "evening";
  }
  return null;
}
