import { getDevLocation, type DevLocation } from "@/lib/clock";
import { buildPrepItems, getPrepChecks, type PrepItem } from "@/features/briefing";
import type { ChecklistItem } from "@/features/checklist";
import { getVault } from "@/features/documents/store";
import { EVENING_FROM, type Spot, type TimedPlace } from "@/features/suggestions";
import { getSuggestionRecords } from "@/features/suggestions/server";
import { OSAKA_SPOTS, placesOfDay, type Place } from "@/features/trip";
import { outfitLine, type DailyForecast } from "@/features/weather";

import type { BudgetSummary } from "./budget";
import { loadForecast, type TripContext } from "./context";

/** Everything the suggestion island needs to pick and render one suggestion. */
export type IslandData = {
  tripId: number;
  nowDate: string;
  nowTime: string;
  todayDay: number | null;
  tomorrowDay: number | null;
  onTodayDayScreen: boolean;
  todayPlaces: TimedPlace[];
  spots: Spot[];
  resolvedToday: string[];
  lastNearbyAt: string | null;
  devLocation: DevLocation | null;
  morning: { places: Place[]; forecast: DailyForecast | null; outfit: string | null } | null;
  evening: { places: Place[]; forecast: DailyForecast | null; prepItems: PrepItem[] } | null;
  budget: BudgetSummary | null;
  /** Flight files, only on the first and last trip day */
  flightFiles: LinkedFile[];
  /** Entry tickets linked to today's places */
  tickets: { placeName: string; files: LinkedFile[] }[];
};

export type LinkedFile = { id: number; fileName: string };

/** Server-side part of the suggestions: records, briefings and weather when they may show. */
export async function loadIslandData(
  ctx: TripContext,
  checklist: ChecklistItem[],
  dayScreen: number | null,
  budget: BudgetSummary | null,
): Promise<IslandData> {
  const { trip, now, todayDay, tomorrowDay, tomorrow } = ctx;
  const [records, devLocation] = await Promise.all([
    getSuggestionRecords(trip.id, now.date),
    getDevLocation(),
  ]);
  const resolved = new Set(records.resolvedToday);

  const vault = todayDay !== null ? await getVault(trip.id) : [];
  const isFlightDay = todayDay === 1 || (todayDay !== null && todayDay === ctx.days);
  const toLinked = (f: { id: number; fileName: string }) => ({ id: f.id, fileName: f.fileName });
  const flightFiles = isFlightDay
    ? (vault.find((slot) => slot.kind === "flight")?.files ?? []).map(toLinked)
    : [];
  const todayPlaces = todayDay ? placesOfDay(trip, todayDay) : [];
  const ticketFiles = vault.find((slot) => slot.kind === "ticket")?.files ?? [];
  const tickets = todayPlaces
    .map((place) => ({
      placeName: place.name,
      files: ticketFiles.filter((f) => f.placeName === place.name).map(toLinked),
    }))
    .filter((t) => t.files.length > 0);

  const morningDue = todayDay !== null && !resolved.has("morning:");
  const eveningDue = tomorrowDay !== null && now.time >= EVENING_FROM && !resolved.has("evening:");

  const [morningForecast, eveningForecast, checks] = await Promise.all([
    morningDue ? loadForecast(now.date) : null,
    eveningDue ? loadForecast(tomorrow) : null,
    eveningDue ? getPrepChecks(trip.id, tomorrow) : null,
  ]);

  return {
    tripId: trip.id,
    nowDate: now.date,
    nowTime: now.time,
    todayDay,
    tomorrowDay,
    onTodayDayScreen: dayScreen !== null && dayScreen === todayDay,
    todayPlaces,
    spots: OSAKA_SPOTS,
    resolvedToday: records.resolvedToday,
    lastNearbyAt: records.lastNearbyAt,
    devLocation,
    budget,
    flightFiles,
    tickets,
    morning:
      morningDue && todayDay
        ? {
            places: placesOfDay(trip, todayDay),
            forecast: morningForecast,
            outfit: morningForecast ? outfitLine(morningForecast) : null,
          }
        : null,
    evening:
      eveningDue && tomorrowDay
        ? {
            places: placesOfDay(trip, tomorrowDay),
            forecast: eveningForecast,
            prepItems: buildPrepItems({
              tomorrowIsFirstDay: tomorrowDay === 1,
              todayIsTripDay: todayDay !== null,
              tomorrowRainChance: eveningForecast?.rainChance ?? null,
              checklist,
              checks: checks ?? {},
            }),
          }
        : null,
  };
}
