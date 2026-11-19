import { cookies } from "next/headers";

import { toTokyoNow, type LocalNow } from "@/lib/tokyo-time";

export const DEV_NOW_COOKIE = "tb-dev-now";
export const DEV_WEATHER_COOKIE = "tb-dev-weather";
export const DEV_LOC_COOKIE = "tb-dev-loc";
export const DEV_PERM_COOKIE = "tb-dev-perm";

export const devSimulationEnabled = process.env.NODE_ENV === "development";

/**
 * Current Osaka local date and time. In development, a `tb-dev-now` cookie
 * (`YYYY-MM-DDTHH:MM`, Osaka local) set through `/dev/sim` overrides it so
 * morning and evening briefings can be checked at any hour.
 */
export async function getTokyoNow(): Promise<LocalNow & { simulated: boolean }> {
  if (devSimulationEnabled) {
    const override = (await cookies()).get(DEV_NOW_COOKIE)?.value;
    const match = override?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    if (match) return { date: match[1], time: match[2], simulated: true };
  }
  return { ...toTokyoNow(new Date()), simulated: false };
}

/** Development-only switch that makes weather loading fail. */
export async function weatherForcedToFail(): Promise<boolean> {
  if (!devSimulationEnabled) return false;
  return (await cookies()).get(DEV_WEATHER_COOKIE)?.value === "fail";
}

export type DevLocation = {
  location: { lat: number; lng: number } | null;
  permission: "granted" | "denied" | "prompt";
};

/**
 * Development-only stand-in for the browser location: `tb-dev-loc` ("lat,lng")
 * and `tb-dev-perm` (granted | denied | prompt), set through `/dev/sim`.
 * Null when neither is set, so the real browser location is used.
 */
export async function getDevLocation(): Promise<DevLocation | null> {
  if (!devSimulationEnabled) return null;
  const jar = await cookies();
  const loc = jar.get(DEV_LOC_COOKIE)?.value?.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  const perm = jar.get(DEV_PERM_COOKIE)?.value;
  if (!loc && !perm) return null;
  const permission = perm === "denied" || perm === "prompt" ? perm : "granted";
  return {
    location: loc ? { lat: Number(loc[1]), lng: Number(loc[2]) } : null,
    permission,
  };
}
