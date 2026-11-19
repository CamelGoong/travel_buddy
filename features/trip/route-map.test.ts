import { describe, expect, it } from "vitest";

import { describeLeg, googleRouteUrl, inServiceArea, mappablePlaces, routeLegs } from "./route-map";

const day = [
  { name: "가이유칸 수족관", time: "10:00", lat: 34.65447, lng: 135.42889 },
  { name: "이름만 넣은 곳", time: "11:30" },
  { name: "덴포잔 대관람차", time: "13:00", lat: 34.6562, lng: 135.43097 },
  { name: "나카노시마 공원", time: "16:00", lat: 34.6924, lng: 135.50776 },
];

describe("mappablePlaces", () => {
  it("keeps only places with coordinates and their position in the day", () => {
    const mapped = mappablePlaces(day);
    expect(mapped.map((p) => p.index)).toEqual([1, 3, 4]);
  });
});

describe("routeLegs", () => {
  it("estimates a short walk and a long transit leg", () => {
    const legs = routeLegs(mappablePlaces(day));
    expect(legs).toHaveLength(2);
    expect(describeLeg(legs[0])).toMatch(/^도보 약 \d+분$/);
    expect(describeLeg(legs[1])).toMatch(/^대중교통 약 \d+분$/);
  });
});

describe("googleRouteUrl", () => {
  it("needs two places and passes the middle ones as waypoints", () => {
    expect(googleRouteUrl([{ lat: 1, lng: 2 }])).toBeNull();
    const url = new URL(googleRouteUrl(mappablePlaces(day))!);
    expect(url.searchParams.get("origin")).toBe("34.65447,135.42889");
    expect(url.searchParams.get("destination")).toBe("34.6924,135.50776");
    expect(url.searchParams.get("waypoints")).toBe("34.6562,135.43097");
    expect(url.searchParams.get("travelmode")).toBe("transit");
  });
});

describe("inServiceArea", () => {
  it("accepts Osaka area and rejects far places", () => {
    expect(inServiceArea(34.6687, 135.5029)).toBe(true);
    expect(inServiceArea(35.68, 139.76)).toBe(false);
    expect(inServiceArea(Number.NaN, 135)).toBe(false);
  });
});
