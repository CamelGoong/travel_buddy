import { createClient } from "@/lib/supabase/server";

import type { ExpenseCategory } from "./categories";
import type { ExpenseInput } from "./validate";

export type Expense = {
  id: number;
  amountYen: number;
  label: string;
  category: ExpenseCategory;
  /** Person tags: whose money this was */
  people: { memberId: number; nickname: string }[];
};

type TagRow = { member_id: number; trip_members: { nickname: string } | null };

export async function getDayExpenses(tripId: number, dayNumber: number): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount_yen, label, category, expense_people(member_id, trip_members(nickname))")
    .eq("trip_id", tripId)
    .eq("day_number", dayNumber)
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    amountYen: row.amount_yen,
    label: row.label,
    category: row.category as ExpenseCategory,
    people: (row.expense_people as unknown as TagRow[]).map((tag) => ({
      memberId: tag.member_id,
      nickname: tag.trip_members?.nickname ?? "",
    })),
  }));
}

/** Total spent per day number for a trip, all members together. */
export async function getSpentByDay(tripId: number): Promise<Record<number, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("day_number, amount_yen")
    .eq("trip_id", tripId);
  if (error) throw error;
  const spent: Record<number, number> = {};
  for (const row of data) spent[row.day_number] = (spent[row.day_number] ?? 0) + row.amount_yen;
  return spent;
}

/** Records an expense with its category and person tags (at least one person). */
export async function insertExpense(
  tripId: number,
  dayNumber: number,
  input: ExpenseInput,
  category: ExpenseCategory,
  memberIds: number[],
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: tripId,
      day_number: dayNumber,
      amount_yen: input.amountYen,
      label: input.label,
      category,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: tagError } = await supabase
    .from("expense_people")
    .insert([...new Set(memberIds)].map((memberId) => ({ expense_id: data.id, member_id: memberId })));
  if (tagError) throw tagError;
}
