"use server";

import { refresh } from "next/cache";

import { parseExpense } from "@/features/expenses";
import { insertExpense } from "@/features/expenses/server";

export type ExpenseFormState = { error: string | null; amount: string; label: string; saved: number };

export async function recordExpense(
  tripId: number,
  dayNumber: number,
  prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const amount = String(formData.get("amount") ?? "");
  const label = String(formData.get("label") ?? "");

  const parsed = parseExpense(amount, label);
  if (!parsed.ok) return { error: parsed.error, amount, label, saved: prev.saved };

  try {
    await insertExpense(tripId, dayNumber, parsed.value);
  } catch {
    return { error: "기록하지 못했어요. 잠시 뒤 다시 시도해 주세요.", amount, label, saved: prev.saved };
  }
  refresh();
  return { error: null, amount: "", label: "", saved: prev.saved + 1 };
}
