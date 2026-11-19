"use server";

import { refresh } from "next/cache";

import { parseCategory, parseExpense } from "@/features/expenses";
import { insertExpense } from "@/features/expenses/server";
import { getMyMember } from "@/features/members/server";

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

  const category = parseCategory(formData.get("category"));
  const picked = formData.getAll("people").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  try {
    const memberIds = picked.length > 0 ? picked : [(await getMyMember(tripId))?.id ?? 0].filter(Boolean);
    if (memberIds.length === 0) {
      return { error: "누구 몫인지 한 명 이상 골라 주세요.", amount, label, saved: prev.saved };
    }
    await insertExpense(tripId, dayNumber, parsed.value, category, memberIds);
  } catch {
    return { error: "기록하지 못했어요. 잠시 뒤 다시 시도해 주세요.", amount, label, saved: prev.saved };
  }
  refresh();
  return { error: null, amount: "", label: "", saved: prev.saved + 1 };
}
