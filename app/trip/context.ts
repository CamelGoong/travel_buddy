import { redirect } from "next/navigation";

import { getTokyoNow, weatherForcedToFail } from "@/lib/clock";
import { getUserId } from "@/lib/supabase/server";
import { addDays } from "@/lib/tokyo-time";
import { dayCount, dayNumberOn, getLatestTrip } from "@/features/trip";
import { fetchOsakaForecast } from "@/features/weather";

export type TripContext = Awaited<ReturnType<typeof loadTripContext>>;

/** Signed-in user's latest trip with "now" in Osaka local time. */
export async function loadTripContext(nextPath = "/trip") {
  const userId = await getUserId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);

  const trip = await getLatestTrip();
  if (!trip) redirect("/trip/new");

  const now = await getTokyoNow();
  const tomorrow = addDays(now.date, 1);
  return {
    trip,
    now,
    tomorrow,
    days: dayCount(trip),
    todayDay: dayNumberOn(trip, now.date),
    tomorrowDay: dayNumberOn(trip, tomorrow),
  };
}

export async function loadForecast(date: string) {
  if (await weatherForcedToFail()) return null;
  return fetchOsakaForecast(date);
}
