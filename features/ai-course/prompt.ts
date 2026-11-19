import { COMPANIONS, INTERESTS, type TripPreferences } from "./options";

export type CourseRequest = TripPreferences & { dayCount: number };

/** Prompt for one course draft plus checklist suggestions. Only dates, companion and interests go in. */
export function buildPrompt(request: CourseRequest): string {
  const companion = COMPANIONS.find((c) => c.key === request.companion)?.hint ?? "정해지지 않음";
  const interests =
    request.interests
      .map((key) => INTERESTS.find((i) => i.key === key)?.hint)
      .filter(Boolean)
      .join(", ") || "정해지지 않음(유명 명소를 고르게)";
  const last = request.dayCount;

  return [
    `한국인 여행자를 위한 오사카 ${request.dayCount}일 일정의 가벼운 코스 초안을 JSON으로 만들어 주세요.`,
    "",
    `- 동행: ${companion}`,
    `- 취향: ${interests}`,
    "",
    "규칙:",
    `- days 배열은 정확히 ${request.dayCount}개이고 1일차부터 순서대로입니다.`,
    "- 장소는 오사카와 당일치기 근교(교토, 나라, 고베)에 실제로 있고 지금 운영 중인 유명 관광지, 상점가, 음식 거리만 고르세요. 확실하지 않은 장소는 넣지 마세요.",
    "- 일차마다 장소는 2–5곳입니다. 1일차와 마지막 일차는 이동을 고려해 적게 잡으세요.",
    "- 같은 장소를 두 번 쓰지 마세요. 같은 일차 안에서는 가까운 곳끼리 묶고, 근교로 가는 날은 그 지역에서 하루를 보내세요.",
    "- 장소 이름은 한국 여행자에게 익숙한 한국어 표기로 쓰세요.",
    "- time은 오사카 현지 시각 HH:MM이고 07:00–22:00 사이이며 일차 안에서 이른 순서입니다.",
    "- lat, lng는 그 장소의 실제 위도와 경도(소수점 다섯 자리)입니다.",
    "- 동행과 취향이 장소 구성에 뚜렷이 드러나게 하세요. 예를 들어 아이를 동반한 가족에게는 심야 술집 위주로 잡지 마세요.",
    `- suggestions는 체크리스트에 더하면 좋을 준비물이나 할 일 1–3개입니다. 각각 20자 이하의 짧은 명사구로 쓰세요. 여권, 항공권, 숙소 예약, 교통패스, 환전은 이미 있으니 넣지 마세요. ${last}일 일정과 동행에 맞는 것을 고르세요.`,
  ].join("\n");
}

/** Gemini response schema (OpenAPI subset). */
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          places: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                time: { type: "STRING" },
                lat: { type: "NUMBER" },
                lng: { type: "NUMBER" },
              },
              required: ["name", "time", "lat", "lng"],
            },
          },
        },
        required: ["places"],
      },
    },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["days", "suggestions"],
} as const;
