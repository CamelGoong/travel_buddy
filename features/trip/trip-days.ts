import { addDays, daysBetween } from "@/lib/tokyo-time";

import { placesForDay, type CourseDay } from "./course";

export type TripDates = { startDate: string; endDate: string };

export const MAX_TRIP_DAYS = 14;

export function dayCount(trip: TripDates): number {
  return daysBetween(trip.startDate, trip.endDate) + 1;
}

export function dateOfDay(trip: TripDates, dayNumber: number): string {
  return addDays(trip.startDate, dayNumber - 1);
}

/** Day number for a date, or null when the date is outside the trip. */
export function dayNumberOn(trip: TripDates, date: string): number | null {
  const n = daysBetween(trip.startDate, date) + 1;
  return n >= 1 && n <= dayCount(trip) ? n : null;
}

export function buildCourse(trip: TripDates): CourseDay[] {
  return Array.from({ length: dayCount(trip) }, (_, i) => ({
    dayNumber: i + 1,
    date: dateOfDay(trip, i + 1),
    places: placesForDay(i + 1),
  }));
}
