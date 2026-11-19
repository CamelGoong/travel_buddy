export type ExpenseInput = { amountYen: number; label: string };

/** Parses the expense form; returns a user-facing reason when it can't be recorded. */
export function parseExpense(
  rawAmount: string,
  rawLabel: string,
): { ok: true; value: ExpenseInput } | { ok: false; error: string } {
  const amountText = rawAmount.replace(/[,\s엔¥]/g, "");
  if (amountText === "") return { ok: false, error: "금액을 입력해 주세요." };
  if (!/^-?\d+$/.test(amountText)) return { ok: false, error: "금액은 숫자로만 입력해 주세요." };
  const amountYen = Number(amountText);
  if (amountYen <= 0) return { ok: false, error: "금액은 0엔보다 커야 해요." };
  if (amountYen > 10_000_000) return { ok: false, error: "금액이 너무 커요. 다시 확인해 주세요." };

  const label = rawLabel.trim();
  if (label === "") return { ok: false, error: "어디에 썼는지 항목을 적어 주세요." };
  if (label.length > 30) return { ok: false, error: "항목은 30자까지 쓸 수 있어요." };

  return { ok: true, value: { amountYen, label } };
}

export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}엔`;
}
