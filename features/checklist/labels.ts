// Rules for items the owner adds to the checklist (docs/specs/checklist-items/).

export const MAX_LABEL = 20;

/** A new item name: 1–20 characters, not already on the checklist (case-insensitive). */
export function validateNewChecklistLabel(
  raw: string,
  existing: string[],
): { ok: true; label: string } | { ok: false; error: string } {
  const label = raw.trim();
  if (label.length === 0) return { ok: false, error: "항목 이름을 적어 주세요." };
  if ([...label].length > MAX_LABEL) return { ok: false, error: `항목 이름은 ${MAX_LABEL}자까지예요.` };
  if (existing.some((name) => name.toLowerCase() === label.toLowerCase())) {
    return { ok: false, error: "이미 있는 항목이에요." };
  }
  return { ok: true, label };
}
