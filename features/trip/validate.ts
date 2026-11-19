import { daysBetween, isValidDate } from "@/lib/tokyo-time";

import { MAX_TRIP_DAYS } from "./trip-days";

/** Returns a user-facing reason when the dates cannot make a trip. */
export function validateTripDates(startDate: string, endDate: string): string | null {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "시작일과 종료일을 모두 골라 주세요.";
  }
  const span = daysBetween(startDate, endDate);
  if (span < 0) return "종료일이 시작일보다 빨라요. 날짜를 다시 골라 주세요.";
  if (span + 1 > MAX_TRIP_DAYS) return `여행 기간은 최대 ${MAX_TRIP_DAYS}일까지 만들 수 있어요.`;
  return null;
}
