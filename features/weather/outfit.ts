import type { DailyForecast } from "./forecast";

export const RAIN_LIKELY_PERCENT = 50;

/** One-line outfit tip picked from fixed rules (no AI). */
export function outfitLine(forecast: Pick<DailyForecast, "maxC" | "rainChance">): string {
  const { maxC, rainChance } = forecast;
  let line: string;
  if (maxC >= 28) line = "반팔에 얇은 하의, 선크림은 필수예요.";
  else if (maxC >= 23) line = "반팔에 얇은 겉옷 하나 챙기면 좋아요.";
  else if (maxC >= 17) line = "긴팔 티에 가벼운 자켓이면 딱이에요.";
  else if (maxC >= 10) line = "니트에 코트나 두툼한 자켓을 입어요.";
  else line = "패딩에 목도리까지 단단히 챙겨요.";
  if (rainChance >= RAIN_LIKELY_PERCENT) line += " 비 소식이 있으니 우산도요.";
  return line;
}
