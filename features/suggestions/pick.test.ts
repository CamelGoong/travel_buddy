import { describe, expect, it } from "vitest";

import { estimateTravel, mapsDirectionsUrl } from "./geo";
import { pickSuggestion, type PickInput } from "./pick";

const places = [
  { name: "오사카성 천수각", time: "10:00", lat: 34.68731, lng: 135.52599 },
  { name: "구로몬 시장", time: "12:30", lat: 34.66565, lng: 135.50668 },
  { name: "신사이바시 쇼핑거리", time: "15:00", lat: 34.67256, lng: 135.50146 },
  { name: "도톤보리", time: "18:00", lat: 34.66868, lng: 135.50278 },
];
const spots = [
  { key: "hozenji", name: "호젠지 요코초", lat: 34.66796, lng: 135.50189 },
  { key: "yasaka", name: "난바 야사카 신사", lat: 34.66116, lng: 135.49717 },
  { key: "far", name: "먼 곳", lat: 34.70, lng: 135.49 },
];

const base: PickInput = {
  nowDate: "2026-11-25",
  nowTime: "11:00",
  todayIsTripDay: true,
  tomorrowIsTripDay: true,
  onTodayDayScreen: true,
  todayPlaces: places,
  spots,
  location: null,
  permission: "denied",
  resolvedToday: new Set(["morning:"]),
  lastNearbyAt: null,
  budgetAheadOfPace: false,
  flightDocsToday: false,
  ticketPlaceNames: new Set(),
  preTrip: null,
};
const resolved = (...keys: string[]) => new Set(["morning:", ...keys]);
/** Meals already asked, so time-window tests see only the suggestion under test. */
const fed = (...keys: string[]) => resolved("expense:lunch", "expense:dinner", ...keys);

describe("priority and briefings", () => {
  it("shows the morning briefing first on a trip day until resolved (AC1, AC2)", () => {
    expect(pickSuggestion({ ...base, resolvedToday: new Set() })?.kind).toBe("morning");
    expect(pickSuggestion(base)).toBeNull();
  });
  it("shows the evening briefing from 20:00 when tomorrow is a trip day (AC4)", () => {
    const eve = { ...base, onTodayDayScreen: false, nowTime: "20:00", resolvedToday: fed() };
    expect(pickSuggestion(eve)?.kind).toBe("evening");
    expect(pickSuggestion({ ...eve, nowTime: "19:59" })).toBeNull();
    expect(pickSuggestion({ ...eve, tomorrowIsTripDay: false })?.kind).not.toBe("evening");
  });
});

describe("next place (AC5, AC6)", () => {
  it("appears from 30 minutes before the next scheduled time", () => {
    expect(pickSuggestion({ ...base, nowTime: "14:29", resolvedToday: fed() })).toBeNull();
    const s = pickSuggestion({ ...base, nowTime: "14:30", resolvedToday: fed() });
    expect(s).toMatchObject({ kind: "next_place", context: "2", trigger: "time", estimate: null });
  });
  it("adds a travel estimate when the location is known", () => {
    const s = pickSuggestion({
      ...base,
      nowTime: "14:30",
      permission: "granted",
      location: { lat: 34.66565, lng: 135.50668 },
    });
    expect(s?.kind).toBe("next_place");
    expect(s && s.kind === "next_place" && s.estimate).toBeTruthy();
  });
  it("appears on arrival within 200m of a place, targeting the following place", () => {
    const s = pickSuggestion({
      ...base,
      nowTime: "11:00",
      permission: "granted",
      location: { lat: 34.6874, lng: 135.526 },
    });
    expect(s).toMatchObject({ kind: "next_place", context: "1", trigger: "arrival" });
  });
  it("does not target past the last place", () => {
    const s = pickSuggestion({
      ...base,
      nowTime: "18:40",
      permission: "granted",
      location: { lat: 34.66868, lng: 135.50278 },
      spots: [],
    });
    expect(s).toBeNull();
  });
  it("does not repeat once resolved (AC7)", () => {
    expect(pickSuggestion({ ...base, nowTime: "14:45", resolvedToday: fed("next_place:2") })).toBeNull();
  });
});

describe("expense prompt (AC10)", () => {
  it("asks after lunch and after dinner, once per meal", () => {
    expect(pickSuggestion({ ...base, onTodayDayScreen: false, nowTime: "13:30" })).toMatchObject({
      kind: "expense",
      context: "lunch",
    });
    expect(
      pickSuggestion({ ...base, onTodayDayScreen: false, nowTime: "13:45", resolvedToday: resolved("expense:lunch") }),
    ).toBeNull();
    expect(pickSuggestion({ ...base, onTodayDayScreen: false, nowTime: "19:30", tomorrowIsTripDay: false })).toMatchObject({
      context: "dinner",
    });
    expect(pickSuggestion({ ...base, onTodayDayScreen: false, nowTime: "13:29" })).toBeNull();
  });
});

describe("location permission and nearby (AC8, AC9, AC11)", () => {
  it("asks for location first on today's day screen", () => {
    expect(pickSuggestion({ ...base, permission: "prompt" })?.kind).toBe("location");
    expect(pickSuggestion({ ...base, permission: "prompt", onTodayDayScreen: false })).toBeNull();
    expect(pickSuggestion({ ...base, permission: "prompt", resolvedToday: resolved("location:") })).toBeNull();
  });
  it("lists up to 3 listed spots within 1km, nearest first, skipping today's course", () => {
    const s = pickSuggestion({
      ...base,
      permission: "granted",
      location: { lat: 34.6688, lng: 135.5025 },
      todayPlaces: [{ ...places[0] }],
    });
    expect(s?.kind).toBe("nearby");
    if (s?.kind !== "nearby") return;
    expect(s.spots.map((x) => x.key)).toEqual(["hozenji", "yasaka"]);
    expect(s.spots[0].walkMinutes).toBeGreaterThan(0);
  });
  it("rests 2 hours after a nearby suggestion and leads with a new spot", () => {
    const input = {
      ...base,
      permission: "granted" as const,
      location: { lat: 34.6688, lng: 135.5025 },
      todayPlaces: [{ ...places[0] }],
    };
    expect(pickSuggestion({ ...input, nowTime: "12:30", lastNearbyAt: "2026-11-25T11:00" })).toBeNull();
    const s = pickSuggestion({
      ...input,
      nowTime: "13:10",
      lastNearbyAt: "2026-11-25T11:00",
      resolvedToday: resolved("nearby:hozenji"),
    });
    expect(s).toMatchObject({ kind: "nearby", context: "yasaka" });
  });
  it("shows nothing nearby when no listed spot is within 1km", () => {
    expect(
      pickSuggestion({ ...base, permission: "granted", location: { lat: 34.75, lng: 135.4 }, todayPlaces: [] }),
    ).toBeNull();
  });
});

describe("travel helpers", () => {
  it("walks under 1km and rides transit beyond", () => {
    expect(estimateTravel(560)).toEqual({ mode: "walk", minutes: 7 });
    expect(estimateTravel(2000).mode).toBe("transit");
  });
  it("builds a Google Maps directions link", () => {
    const url = new URL(mapsDirectionsUrl({ lat: 34.67256, lng: 135.50146 }, "transit"));
    expect(url.searchParams.get("destination")).toBe("34.67256,135.50146");
    expect(url.searchParams.get("travelmode")).toBe("transit");
  });
});

describe("budget pace (osaka-trip-budget AC7–AC9)", () => {
  const paced = { ...base, onTodayDayScreen: false, nowTime: "11:00", budgetAheadOfPace: true };
  it("asks once a day when spending runs ahead of the days", () => {
    expect(pickSuggestion(paced)?.kind).toBe("budget_pace");
    expect(pickSuggestion({ ...paced, resolvedToday: resolved("budget_pace:") })).toBeNull();
    expect(pickSuggestion({ ...paced, budgetAheadOfPace: false })).toBeNull();
  });
  it("comes right after the meal prompt and before the location ask", () => {
    expect(pickSuggestion({ ...paced, nowTime: "13:30" })?.kind).toBe("expense");
    expect(pickSuggestion({ ...paced, onTodayDayScreen: true, permission: "prompt", resolvedToday: fed() })?.kind).toBe("budget_pace");
  });
});

describe("document suggestions (trip-documents AC10–AC12)", () => {
  const usj = { name: "도톤보리", time: "18:00", lat: 34.66868, lng: 135.50278 };
  const at = { permission: "granted" as const, location: { lat: usj.lat, lng: usj.lng } };

  it("shows the flight island on a flight day until resolved", () => {
    const flight = { ...base, flightDocsToday: true };
    expect(pickSuggestion(flight)?.kind).toBe("flight");
    expect(pickSuggestion({ ...flight, resolvedToday: resolved("flight:") })).toBeNull();
    expect(pickSuggestion(base)).toBeNull();
  });
  it("shows the ticket island within 200 m of a linked place, once", () => {
    const input = { ...base, ...at, ticketPlaceNames: new Set([usj.name]), resolvedToday: fed() };
    expect(pickSuggestion(input)).toMatchObject({ kind: "ticket", context: usj.name });
    expect(pickSuggestion({ ...input, resolvedToday: fed(`ticket:${usj.name}`) })?.kind).not.toBe("ticket");
    expect(pickSuggestion({ ...input, ticketPlaceNames: new Set(["구로몬 시장"]) })?.kind).not.toBe("ticket");
    expect(pickSuggestion({ ...input, location: { lat: 34.7, lng: 135.49 } })?.kind).not.toBe("ticket");
    expect(pickSuggestion({ ...input, todayIsTripDay: false })?.kind).not.toBe("ticket");
  });
  it("orders morning, flight, evening, ticket, next place", () => {
    const all = {
      ...base,
      ...at,
      nowTime: "20:30",
      flightDocsToday: true,
      ticketPlaceNames: new Set([usj.name]),
      resolvedToday: new Set<string>(),
    };
    expect(pickSuggestion(all)?.kind).toBe("morning");
    expect(pickSuggestion({ ...all, resolvedToday: new Set(["morning:"]) })?.kind).toBe("flight");
    expect(pickSuggestion({ ...all, resolvedToday: new Set(["morning:", "flight:"]) })?.kind).toBe("evening");
    expect(
      pickSuggestion({ ...all, resolvedToday: new Set(["morning:", "flight:", "evening:"]) })?.kind,
    ).toBe("ticket");
  });
});

describe("places typed in without coordinates (trip-course-edit AC5)", () => {
  it("opens a name search for directions and skips arrival detection", () => {
    const url = new URL(mapsDirectionsUrl({ name: "이치란 라멘" }, "transit"));
    expect(url.searchParams.get("destination")).toBe("이치란 라멘 오사카");
    const typed = [
      { name: "오사카성 천수각", time: "10:00", lat: 34.68731, lng: 135.52599 },
      { name: "이치란 라멘", time: "12:30" },
    ];
    const s = pickSuggestion({
      ...base,
      todayPlaces: typed,
      nowTime: "12:00",
      permission: "granted",
      location: { lat: 34.68731, lng: 135.52599 },
      resolvedToday: new Set(["morning:", "expense:lunch", "expense:dinner"]),
    });
    expect(s).toMatchObject({ kind: "next_place", place: { name: "이치란 라멘" }, estimate: null });
  });
});

describe("before-trip nudges (pre-trip-nudges AC5–AC8)", () => {
  const pre = {
    ...base,
    todayIsTripDay: false,
    tomorrowIsTripDay: false,
    onTodayDayScreen: false,
    todayPlaces: [],
    resolvedToday: new Set<string>(),
    preTrip: { passPending: true, ticketPlaces: ["유니버설 스튜디오 재팬", "오사카성 천수각"], fxReady: true },
  };
  const sequence = (resolvedKeys: string[]) => pickSuggestion({ ...pre, resolvedToday: new Set(resolvedKeys) });

  it("goes pass, transport, tickets in course order, coupon, then fx", () => {
    expect(sequence([])?.kind).toBe("buy_pass");
    expect(sequence(["buy_pass:"])?.kind).toBe("buy_transport");
    expect(sequence(["buy_pass:", "buy_transport:"])).toMatchObject({ kind: "buy_ticket", context: "유니버설 스튜디오 재팬" });
    expect(sequence(["buy_pass:", "buy_transport:", "buy_ticket:유니버설 스튜디오 재팬"])).toMatchObject({
      kind: "buy_ticket",
      context: "오사카성 천수각",
    });
    const rest = ["buy_pass:", "buy_transport:", "buy_ticket:유니버설 스튜디오 재팬", "buy_ticket:오사카성 천수각"];
    expect(sequence(rest)?.kind).toBe("buy_coupon");
    expect(sequence([...rest, "buy_coupon:"])?.kind).toBe("fx");
    expect(sequence([...rest, "buy_coupon:", "fx:"])).toBeNull();
  });
  it("skips the pass nudge once the checklist item is done and fx when the rate is missing", () => {
    const only = pickSuggestion({ ...pre, preTrip: { passPending: false, ticketPlaces: [], fxReady: false } });
    expect(only?.kind).toBe("buy_transport");
    const none = pickSuggestion({
      ...pre,
      preTrip: { passPending: false, ticketPlaces: [], fxReady: false },
      resolvedToday: new Set(["buy_transport:", "buy_coupon:"]),
    });
    expect(none).toBeNull();
  });
  it("never shows before-trip nudges during the trip or outside the window", () => {
    expect(pickSuggestion({ ...pre, preTrip: null })).toBeNull();
    expect(pickSuggestion({ ...base, resolvedToday: new Set(["morning:", "expense:lunch", "expense:dinner"]), preTrip: null })).toBeNull();
  });
  it("lets the evening briefing come first the night before", () => {
    const eve = { ...pre, tomorrowIsTripDay: true, nowTime: "20:30" };
    expect(pickSuggestion(eve)?.kind).toBe("evening");
  });
});
