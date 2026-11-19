import { cookies } from "next/headers";

import { toTokyoNow, type LocalNow } from "@/lib/tokyo-time";

export const DEV_NOW_COOKIE = "tb-dev-now";
export const DEV_WEATHER_COOKIE = "tb-dev-weather";

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
