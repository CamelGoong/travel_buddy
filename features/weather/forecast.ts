// Daily Osaka forecast from Open-Meteo (no key needed; up to 16 days ahead).

export type DailyForecast = {
  date: string;
  maxC: number;
  minC: number;
  /** Max precipitation probability of the day, 0-100 */
  rainChance: number;
  weatherCode: number;
};

const OSAKA = { latitude: 34.6937, longitude: 135.5023 };

export async function fetchOsakaForecast(date: string): Promise<DailyForecast | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(OSAKA.latitude));
  url.searchParams.set("longitude", String(OSAKA.longitude));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  url.searchParams.set("timezone", "Asia/Tokyo");
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const d = body?.daily;
    const maxC = d?.temperature_2m_max?.[0];
    const minC = d?.temperature_2m_min?.[0];
    if (typeof maxC !== "number" || typeof minC !== "number") return null;
    return {
      date,
      maxC: Math.round(maxC),
      minC: Math.round(minC),
      rainChance: d?.precipitation_probability_max?.[0] ?? 0,
      weatherCode: d?.weather_code?.[0] ?? 0,
    };
  } catch {
    return null;
  }
}
