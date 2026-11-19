// Server-only: fetches the reference rate (Frankfurter, ECB data; no key). Never throws.
import { fxForcedToFail } from "@/lib/clock";
import { addDays, toTokyoNow } from "@/lib/tokyo-time";

import { makeSnapshot, type FxSnapshot } from "./rate";

const API = "https://api.frankfurter.dev/v1";
const DAY_SECONDS = 24 * 60 * 60;

type RangeResponse = { rates: Record<string, { KRW: number }> };

/** Latest yen→won reference rate with its 30-day average, or null when it cannot be had. */
export async function getFxSnapshot(): Promise<FxSnapshot | null> {
  if (await fxForcedToFail()) return null;
  try {
    const today = toTokyoNow(new Date()).date;
    const from = addDays(today, -30);
    const response = await fetch(`${API}/${from}..${today}?base=JPY&symbols=KRW`, {
      next: { revalidate: DAY_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as RangeResponse;
    const days = Object.keys(body.rates).sort();
    if (days.length === 0) return null;
    const history = days.map((day) => body.rates[day].KRW);
    return makeSnapshot(history[history.length - 1], history);
  } catch {
    return null;
  }
}
