// Choices offered when creating a trip. Keys are stored; labels are shown.

export const COMPANIONS = [
  { key: "solo", label: "혼자", hint: "혼자 여행하는 사람" },
  { key: "friends", label: "친구", hint: "친구들과 함께" },
  { key: "couple", label: "연인", hint: "연인과 함께" },
  { key: "family-kids", label: "가족·아이", hint: "아이를 동반한 가족" },
  { key: "parents", label: "부모님", hint: "부모님을 모시고" },
] as const;

export const INTERESTS = [
  { key: "food", label: "맛집", hint: "맛집과 먹거리" },
  { key: "shopping", label: "쇼핑", hint: "쇼핑" },
  { key: "history-culture", label: "역사·문화", hint: "역사와 문화 유적" },
  { key: "theme-park", label: "테마파크", hint: "테마파크" },
  { key: "night-view", label: "야경", hint: "야경과 전망대" },
  { key: "cafe", label: "카페", hint: "카페" },
] as const;

export const MAX_INTERESTS = 3;

export type CompanionKey = (typeof COMPANIONS)[number]["key"];
export type InterestKey = (typeof INTERESTS)[number]["key"];

export type TripPreferences = { companion: CompanionKey | null; interests: InterestKey[] };

/** Keeps only known choices: one companion, at most three distinct interests. */
export function parsePreferences(companion: unknown, interests: unknown[]): TripPreferences {
  const companionKey = COMPANIONS.find((c) => c.key === companion)?.key ?? null;
  const picked = INTERESTS.map((i) => i.key).filter((key) => interests.includes(key));
  return { companion: companionKey, interests: picked.slice(0, MAX_INTERESTS) };
}
