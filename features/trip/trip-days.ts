import { addDays, daysBetween } from "@/lib/tokyo-time";

import { placesForDay, type CourseDay, type Place } from "./course";

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

/** Dates plus the stored AI course; a null course means the default course. */
export type TripCourse = TripDates & { course?: Place[][] | null };

/** Places of one day: the stored course when there is one, else the default course. */
export function placesOfDay(trip: TripCourse, dayNumber: number): Place[] {
  return trip.course ? (trip.course[dayNumber - 1] ?? []) : placesForDay(dayNumber);
}

export function buildCourse(trip: TripCourse): CourseDay[] {
  return Array.from({ length: dayCount(trip) }, (_, i) => ({
    dayNumber: i + 1,
    date: dateOfDay(trip, i + 1),
    places: placesOfDay(trip, i + 1),
  }));
}
