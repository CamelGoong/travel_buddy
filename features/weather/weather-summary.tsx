import { RiCloudOffLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { DailyForecast } from "./forecast";

function weatherLabel(code: number): string {
  if (code === 0) return "맑음";
  if (code <= 3) return "구름 조금";
  if (code <= 48) return "흐리고 안개";
  if (code <= 67 || (code >= 80 && code <= 82)) return "비";
  if (code <= 77 || code === 85 || code === 86) return "눈";
  return "뇌우";
}

/** Osaka high/low and rain chance, or a notice when the forecast failed. */
export function WeatherSummary({ forecast }: { forecast: DailyForecast | null }) {
  if (!forecast) {
    return (
      <Alert data-testid="weather-error">
        <RiCloudOffLine />
        <AlertTitle>날씨를 불러오지 못했어요</AlertTitle>
        <AlertDescription>잠시 뒤 다시 열면 보일 수 있어요.</AlertDescription>
      </Alert>
    );
  }
  return (
    <dl className="grid grid-cols-3 gap-2 text-center" data-testid="weather">
      <div className="rounded-lg bg-muted px-2 py-3">
        <dt className="text-xs text-muted-foreground">최고 · 최저</dt>
        <dd className="font-heading text-lg font-semibold">
          {forecast.maxC}° / {forecast.minC}°
        </dd>
      </div>
      <div className="rounded-lg bg-muted px-2 py-3">
        <dt className="text-xs text-muted-foreground">강수 확률</dt>
        <dd className="font-heading text-lg font-semibold">{forecast.rainChance}%</dd>
      </div>
      <div className="rounded-lg bg-muted px-2 py-3">
        <dt className="text-xs text-muted-foreground">하늘</dt>
        <dd className="text-lg font-semibold">{weatherLabel(forecast.weatherCode)}</dd>
      </div>
    </dl>
  );
}
