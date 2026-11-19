import { daysBetween } from "@/lib/tokyo-time";

export type Station = { key: string; label: string };

export type RouteLineModel = {
  stations: Station[];
  /** Index of the glowing station, or null when no station is current */
  activeIndex: number | null;
  /** Stations up to and including this index count as passed (-1 = none) */
  passedThrough: number;
  /** Name of the current stage, shown as text on the line */
  caption: string;
};

/** Whole-trip line: 출발 전 → 1일차 → … → 마지막 일차, lit by today's date. */
export function tripStage(input: {
  today: string;
  startDate: string;
  dayCount: number;
}): RouteLineModel {
  const stations: Station[] = [
    { key: "before", label: "출발 전" },
    ...Array.from({ length: input.dayCount }, (_, i) => ({
      key: `day-${i + 1}`,
      label: `${i + 1}일차`,
    })),
  ];
  const offset = daysBetween(input.startDate, input.today);

  if (offset < 0) {
    return { stations, activeIndex: 0, passedThrough: 0, caption: `출발 전 · D-${-offset}` };
  }
  if (offset >= input.dayCount) {
    return { stations, activeIndex: null, passedThrough: input.dayCount, caption: "여행 끝 · 수고했어요" };
  }
  const day = offset + 1;
  return { stations, activeIndex: day, passedThrough: day, caption: `${day}일차` };
}

type TimedPlace = { name: string; time: string };

/**
 * Day line: one station per place, by scheduled time. The current place is the
 * latest one whose scheduled time is at or before now (Osaka local time).
 */
export function dayStage(input: {
  dayNumber: number;
  dayDate: string;
  today: string;
  nowTime: string;
  places: TimedPlace[];
}): RouteLineModel {
  const { places } = input;
  const stations = places.map((p, i) => ({ key: `place-${i}`, label: p.time }));
  const dayLabel = `${input.dayNumber}일차`;

  if (places.length === 0) {
    return { stations, activeIndex: null, passedThrough: -1, caption: `${dayLabel} · 자유 일정` };
  }

  const relation = daysBetween(input.today, input.dayDate);
  if (relation > 0) {
    return {
      stations,
      activeIndex: null,
      passedThrough: -1,
      caption: `${dayLabel} · 첫 일정 ${places[0].time}`,
    };
  }
  if (relation < 0) {
    return { stations, activeIndex: null, passedThrough: places.length - 1, caption: `${dayLabel} · 다녀왔어요` };
  }

  let current = -1;
  places.forEach((p, i) => {
    if (p.time <= input.nowTime) current = i;
  });

  if (current === -1) {
    return {
      stations,
      activeIndex: null,
      passedThrough: -1,
      caption: `첫 일정 ${places[0].time} ${places[0].name}`,
    };
  }
  const next = places[current + 1];
  return {
    stations,
    activeIndex: current,
    passedThrough: current,
    caption: next
      ? `${places[current].name} · 다음 ${next.time}`
      : `${places[current].name} · 오늘 마지막 일정`,
  };
}
