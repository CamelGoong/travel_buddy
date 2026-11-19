"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatYen } from "@/features/expenses";

import { saveBudget, type BudgetFormState } from "./actions";
import type { BudgetSummary } from "./budget";

export function BudgetCard({ summary }: { summary: BudgetSummary | null }) {
  const [editing, setEditing] = useState(summary === null);
  const [state, formAction, pending] = useActionState<BudgetFormState, FormData>(
    async (prev, formData) => {
      const next = await saveBudget(prev, formData);
      if (!next.error) setEditing(formData.get("intent") === "clear");
      return next;
    },
    { error: null, value: summary ? String(summary.budgetYen) : "" },
  );

  return (
    <Card data-testid="budget">
      <CardHeader>
        <CardTitle>예산</CardTitle>
        <CardDescription>
          {summary ? `총 ${formatYen(summary.budgetYen)}` : "여행 전체에 쓸 돈을 정하면 하루 권장액을 알려 드려요."}
        </CardDescription>
        {summary && !editing && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              바꾸기
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {summary && (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat label="쓴 돈" value={formatYen(summary.spent)} />
            <Stat
              label="남은 돈"
              value={summary.remaining >= 0 ? formatYen(summary.remaining) : `−${formatYen(-summary.remaining)}`}
            />
            <Stat label={todayLabel(summary)} value={todayValue(summary)} />
          </dl>
        )}
        {editing && (
          <form action={formAction} className="flex flex-col gap-3">
            <Field data-invalid={!!state.error || undefined}>
              <FieldLabel htmlFor="budget-amount">예산 (엔)</FieldLabel>
              <Input
                key={state.value}
                id="budget-amount"
                name="budget"
                inputMode="numeric"
                placeholder="80,000"
                defaultValue={state.value}
                aria-invalid={!!state.error || undefined}
              />
              <FieldError>{state.error}</FieldError>
            </Field>
            <div className="flex justify-end gap-2">
              {summary && (
                <Button type="submit" name="intent" value="clear" variant="ghost" size="sm" disabled={pending}>
                  예산 지우기
                </Button>
              )}
              <Button type="submit" name="intent" value="save" size="sm" disabled={pending}>
                {pending ? "저장하는 중…" : "저장"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function todayLabel(s: BudgetSummary) {
  if (s.today.kind === "average") return "하루 평균";
  if (s.today.kind === "done") return "여행 끝";
  return "오늘 권장";
}

function todayValue(s: BudgetSummary) {
  switch (s.today.kind) {
    case "average":
    case "allowance":
      return formatYen(s.today.yen);
    case "over":
      return `${formatYen(s.today.yen)} 초과`;
    case "done":
      return "수고했어요";
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
