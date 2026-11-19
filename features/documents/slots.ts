// Document vault rules shared by server and client (docs/specs/trip-documents/).

export type SlotKind = "passport" | "flight" | "stay" | "transit-pass" | "ticket" | "insurance" | "custom";

export const DEFAULT_SLOTS: { kind: Exclude<SlotKind, "custom">; name: string }[] = [
  { kind: "passport", name: "여권" },
  { kind: "flight", name: "항공권" },
  { kind: "stay", name: "숙소 예약" },
  { kind: "transit-pass", name: "교통패스" },
  { kind: "ticket", name: "입장권" },
  { kind: "insurance", name: "여행자 보험" },
];

/** Slot kinds whose first upload completes the checklist item with the same key. */
export const CHECKLIST_KEY_OF_SLOT: Partial<Record<SlotKind, string>> = {
  passport: "passport",
  flight: "flight",
  stay: "stay",
  "transit-pass": "transit-pass",
};

/** Slot kinds whose files are saved on the device automatically; the others need the switch. */
export const OFFLINE_BY_DEFAULT: SlotKind[] = ["flight", "stay", "transit-pass", "ticket"];

export function savedOffline(kind: SlotKind, offlineSwitch: boolean): boolean {
  return OFFLINE_BY_DEFAULT.includes(kind) || offlineSwitch;
}

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_SLOT = 10;
export const MAX_CUSTOM_SLOTS = 10;
export const MAX_SLOT_NAME = 20;

/** Why a file cannot be uploaded, or null when it can. */
export function fileProblem(file: { type: string; size: number }, existingCount: number): string | null {
  if (existingCount >= MAX_FILES_PER_SLOT) return `한 칸에는 ${MAX_FILES_PER_SLOT}개까지만 올릴 수 있어요.`;
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) return "JPG, PNG, PDF 파일만 올릴 수 있어요.";
  if (file.size > MAX_FILE_BYTES) return "파일이 10MB를 넘어요.";
  if (file.size === 0) return "빈 파일이에요.";
  return null;
}

export function parseSlotName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, error: "칸 이름을 적어 주세요." };
  if (name.length > MAX_SLOT_NAME) return { ok: false, error: `이름은 ${MAX_SLOT_NAME}자까지예요.` };
  return { ok: true, name };
}
