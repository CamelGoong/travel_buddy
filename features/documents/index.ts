// Client-safe public API. Server-only access lives in ./store.
export {
  ALLOWED_TYPES,
  CHECKLIST_KEY_OF_SLOT,
  DEFAULT_SLOTS,
  fileProblem,
  MAX_CUSTOM_SLOTS,
  MAX_FILES_PER_SLOT,
  MAX_SLOT_NAME,
  OFFLINE_BY_DEFAULT,
  savedOffline,
  parseSlotName,
  type SlotKind,
} from "./slots";
