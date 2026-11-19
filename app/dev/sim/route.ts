import { NextResponse, type NextRequest } from "next/server";

import { DEV_NOW_COOKIE, DEV_WEATHER_COOKIE, devSimulationEnabled } from "@/lib/clock";

/**
 * Development only. Pretend the Osaka local time is `now` and/or make weather
 * loading fail, so morning and evening briefings can be checked at any hour.
 *   /dev/sim?now=2026-11-19T20:30   /dev/sim?weather=fail   /dev/sim?reset=1
 */
export function GET(request: NextRequest) {
  if (!devSimulationEnabled) return new NextResponse(null, { status: 404 });

  const params = request.nextUrl.searchParams;
  const to = params.get("to") ?? "/trip";
  const response = NextResponse.redirect(
    new URL(to.startsWith("/") ? to : "/trip", request.url),
  );

  if (params.has("reset")) {
    response.cookies.delete(DEV_NOW_COOKIE);
    response.cookies.delete(DEV_WEATHER_COOKIE);
    return response;
  }
  const now = params.get("now");
  if (now !== null) {
    if (now === "") response.cookies.delete(DEV_NOW_COOKIE);
    else response.cookies.set(DEV_NOW_COOKIE, now, { path: "/" });
  }
  const weather = params.get("weather");
  if (weather !== null) {
    if (weather === "fail") response.cookies.set(DEV_WEATHER_COOKIE, "fail", { path: "/" });
    else response.cookies.delete(DEV_WEATHER_COOKIE);
  }
  return response;
}
