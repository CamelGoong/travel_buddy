// Purchase recommendations that hand off to a MyRealTrip search (docs/specs/pre-trip-nudges/).
// The app never sells or buys anything; it only opens a search result.

export const MRT_SEARCH = "https://www.myrealtrip.com/search";

export function mrtSearchUrl(keyword: string): string {
  const url = new URL(MRT_SEARCH);
  url.searchParams.set("query", keyword);
  return url.toString();
}

export const PASS_KEYWORD = "오사카 교통패스";
export const TRANSPORT_KEYWORD = "오사카 공항 교통권";
export const COUPON_KEYWORD = "오사카 할인 쿠폰";
export const ticketKeyword = (place: string) => `${place} 입장권`;

/** Course places that usually need an entry ticket bought ahead. */
export const TICKET_PLACES = [
  "유니버설 스튜디오 재팬",
  "오사카성 천수각",
  "우메다 공중정원 전망대",
  "아베노 하루카스 300",
  "가이유칸 수족관",
  "덴포잔 대관람차",
  "신세카이 · 츠텐카쿠",
] as const;

/** Days before departure when purchase and exchange nudges start. */
export const NUDGE_WINDOW_DAYS = 14;

/** True from 14 days before the first day until the day before it. */
export function inNudgeWindow(daysUntilStart: number): boolean {
  return daysUntilStart >= 1 && daysUntilStart <= NUDGE_WINDOW_DAYS;
}

/**
 * Course places that need a ticket and have none linked, in course order.
 * `linked` holds place names that already have an uploaded entry ticket.
 */
export function ticketsStillNeeded(coursePlaces: string[], linked: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  const needed: string[] = [];
  for (const name of coursePlaces) {
    if ((TICKET_PLACES as readonly string[]).includes(name) && !linked.has(name) && !seen.has(name)) {
      seen.add(name);
      needed.push(name);
    }
  }
  return needed;
}
