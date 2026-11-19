import { createClient } from "@/lib/supabase/server";

import type { ExpenseInput } from "./validate";

export type Expense = { id: number; amountYen: number; label: string };

export async function getDayExpenses(tripId: number, dayNumber: number): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount_yen, label")
    .eq("trip_id", tripId)
    .eq("day_number", dayNumber)
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({ id: row.id, amountYen: row.amount_yen, label: row.label }));
}

/** Total spent per day number for a trip. */
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

export async function insertExpense(
  tripId: number,
  dayNumber: number,
  input: ExpenseInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    trip_id: tripId,
    day_number: dayNumber,
    amount_yen: input.amountYen,
    label: input.label,
  });
  if (error) throw error;
}
