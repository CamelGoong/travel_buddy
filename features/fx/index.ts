// Client-safe public API. The network fetch lives in ./server.
export {
  formatDiffPct,
  formatHundredYen,
  formatWonApprox,
  FX_DISCLAIMER,
  fxJudgment,
  fxTone,
  makeSnapshot,
  toWon,
  type FxSnapshot,
  type FxTone,
} from "./rate";
