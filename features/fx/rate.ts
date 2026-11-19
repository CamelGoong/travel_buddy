// Yen to won reference rate and the soft judgment line (docs/specs/pre-trip-nudges/). Pure rules.

export type FxSnapshot = {
  /** Won per 1 yen, latest reference rate */
  rate: number;
  /** Average over the last ~30 days */
  avg30: number;
  /** (rate - avg30) / avg30 in percent */
  diffPct: number;
};

export const FX_NEUTRAL_BAND_PCT = 2;
export const FX_DISCLAIMER = "참고용이에요. 환전은 은행이나 앱에서 직접 해 주세요.";

export function makeSnapshot(rate: number, history: number[]): FxSnapshot | null {
  if (!Number.isFinite(rate) || rate <= 0 || history.length === 0) return null;
  const avg30 = history.reduce((sum, value) => sum + value, 0) / history.length;
  return { rate, avg30, diffPct: ((rate - avg30) / avg30) * 100 };
}

export type FxTone = "low" | "even" | "high";

export function fxTone(diffPct: number): FxTone {
  if (diffPct <= -FX_NEUTRAL_BAND_PCT) return "low";
  if (diffPct >= FX_NEUTRAL_BAND_PCT) return "high";
  return "even";
}

export function fxJudgment(tone: FxTone): string {
  switch (tone) {
    case "low":
      return "평소보다 낮아서 환전하기 괜찮은 편이에요.";
    case "high":
      return "평소보다 조금 비싸요. 급하지 않으면 며칠 지켜봐도 돼요.";
    case "even":
      return "평소와 비슷해요.";
  }
}

/** "100엔 = 836원" */
export function formatHundredYen(rate: number): string {
  return `100엔 = ${Math.round(rate * 100).toLocaleString("ko-KR")}원`;
}

/** Signed one-decimal percent such as "−2.4%" or "+1.0%" */
export function formatDiffPct(diffPct: number): string {
  const rounded = Math.round(diffPct * 10) / 10;
  return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded).toFixed(1)}%`;
}

export function toWon(yen: number, rate: number): number {
  return Math.round(yen * rate);
}

/** "≈ 10,700원" for an amount in yen */
export function formatWonApprox(yen: number, rate: number): string {
  return `≈ ${toWon(yen, rate).toLocaleString("ko-KR")}원`;
}
