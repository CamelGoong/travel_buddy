// Shape check for the model's JSON. Anything off means the caller falls back
// to the default course, so this rejects instead of repairing.

export type GeneratedPlace = { name: string; time: string; lat: number; lng: number };

export type GeneratedDraft = {
  /** One entry per day, in day order */
  days: GeneratedPlace[][];
  suggestions: string[];
};

export type ValidateResult = { ok: true; draft: GeneratedDraft } | { ok: false };

/** Osaka and day-trip range (Kyoto, Nara, Kobe included). */
const LAT_RANGE = [34.2, 35.2] as const;
const LNG_RANGE = [134.9, 136.0] as const;

const MAX_PLACES_PER_DAY = 5;
const MAX_SUGGESTIONS = 3;
const MAX_SUGGESTION_LENGTH = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  return value >= "07:00" && value <= "22:00" && Number(value.slice(3)) < 60;
}

function validPlace(value: unknown): GeneratedPlace | null {
  if (!isRecord(value)) return null;
  const { name, time, lat, lng } = value;
  if (typeof name !== "string" || name.trim() === "" || name.length > 40) return null;
  if (!validTime(time)) return null;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (lat < LAT_RANGE[0] || lat > LAT_RANGE[1] || lng < LNG_RANGE[0] || lng > LNG_RANGE[1]) {
    return null;
  }
  return { name: name.trim(), time, lat, lng };
}

/**
 * Checks the parsed model output for a trip of `dayCount` days. Every day needs at
 * least one valid place; a place already used on an earlier day is dropped.
 * `excludedLabels` are checklist labels whose meaning is already covered.
 */
export function validateDraft(
  raw: unknown,
  dayCount: number,
  excludedLabels: readonly string[] = [],
): ValidateResult {
  if (!isRecord(raw) || !Array.isArray(raw.days) || raw.days.length !== dayCount) {
    return { ok: false };
  }

  const used = new Set<string>();
  const days: GeneratedPlace[][] = [];
  for (const day of raw.days) {
    if (!isRecord(day) || !Array.isArray(day.places)) return { ok: false };
    const places: GeneratedPlace[] = [];
    for (const item of day.places) {
      const place = validPlace(item);
      if (!place) return { ok: false };
      if (used.has(place.name)) continue;
      used.add(place.name);
      places.push(place);
    }
    if (places.length === 0) return { ok: false };
    places.sort((a, b) => a.time.localeCompare(b.time));
    days.push(places.slice(0, MAX_PLACES_PER_DAY));
  }

  return { ok: true, draft: { days, suggestions: cleanSuggestions(raw.suggestions, excludedLabels) } };
}

/** Suggestions are optional: a bad entry is skipped without failing the course. */
function cleanSuggestions(value: unknown, excludedLabels: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const label = item.trim();
    if (label === "" || label.length > MAX_SUGGESTION_LENGTH || seen.has(label)) continue;
    if (excludedLabels.some((e) => label.includes(e) || e.includes(label))) continue;
    seen.add(label);
    result.push(label);
    if (result.length === MAX_SUGGESTIONS) break;
  }
  return result;
}
