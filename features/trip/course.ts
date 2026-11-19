// Fixed list of well-known Osaka spots used to fill the course draft.
// Temporary until AI course generation replaces it (see the spec's deferred decisions).

export type Place = {
  name: string;
  /** Scheduled time, HH:MM in Osaka local time */
  time: string;
};

export type CourseDay = {
  dayNumber: number;
  date: string;
  /** Empty for a free day beyond the fixed list */
  places: Place[];
};

const OSAKA_DAYS: Place[][] = [
  [
    { name: "오사카성 천수각", time: "10:00" },
    { name: "구로몬 시장", time: "12:30" },
    { name: "신사이바시 쇼핑거리", time: "15:00" },
    { name: "도톤보리", time: "18:00" },
  ],
  [
    { name: "유니버설 스튜디오 재팬", time: "09:00" },
    { name: "우메다 공중정원 전망대", time: "19:30" },
  ],
  [
    { name: "시텐노지", time: "10:00" },
    { name: "신세카이 · 츠텐카쿠", time: "12:00" },
    { name: "아베노 하루카스 300", time: "16:00" },
  ],
  [
    { name: "가이유칸 수족관", time: "10:00" },
    { name: "덴포잔 대관람차", time: "13:00" },
    { name: "나카노시마 공원", time: "16:00" },
  ],
  [
    { name: "오사카 주택박물관", time: "10:00" },
    { name: "덴진바시스지 상점가", time: "12:00" },
    { name: "나카자키초 카페거리", time: "14:30" },
  ],
];

/** Places for one day of the draft; days past the fixed list are free days. */
export function placesForDay(dayNumber: number): Place[] {
  return OSAKA_DAYS[dayNumber - 1] ?? [];
}
