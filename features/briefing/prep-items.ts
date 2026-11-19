export type PrepItem = {
  key: string;
  label: string;
  done: boolean;
  /** Set when the item mirrors a pre-departure checklist item */
  checklistItemId?: number;
};

export type PrepChecklistItem = { id: number; key: string; label: string; done: boolean };

export const UMBRELLA_KEY = "umbrella";
export const CHARGE_KEY = "charge";

/** prep_checks key that remembers a checklist item was offered on this evening */
export const checklistPrepKey = (itemKey: string) => `checklist:${itemKey}`;

export type PrepInput = {
  tomorrowIsFirstDay: boolean;
  todayIsTripDay: boolean;
  /** null when the forecast could not be loaded */
  tomorrowRainChance: number | null;
  checklist: PrepChecklistItem[];
  /** prep_checks for this evening, by key */
  checks: Record<string, boolean>;
};

const RAIN_LIKELY_PERCENT = 50;

/** Prep items for the evening briefing, from three fixed rules. */
export function buildPrepItems(input: PrepInput): PrepItem[] {
  const items: PrepItem[] = [];

  if (input.tomorrowIsFirstDay) {
    for (const item of input.checklist) {
      // Keep an item checked tonight visible after a reload.
      const offeredTonight = checklistPrepKey(item.key) in input.checks;
      if (!item.done || offeredTonight) {
        items.push({
          key: checklistPrepKey(item.key),
          label: item.label,
          done: item.done,
          checklistItemId: item.id,
        });
      }
    }
  }

  if (input.tomorrowRainChance !== null && input.tomorrowRainChance >= RAIN_LIKELY_PERCENT) {
    items.push({ key: UMBRELLA_KEY, label: "우산 챙기기", done: !!input.checks[UMBRELLA_KEY] });
  }

  if (input.todayIsTripDay) {
    items.push({
      key: CHARGE_KEY,
      label: "휴대폰·보조배터리 충전하기",
      done: !!input.checks[CHARGE_KEY],
    });
  }

  return items;
}
