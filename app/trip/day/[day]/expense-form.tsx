"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TagChip } from "@/components/tag-chip";
import { EXPENSE_CATEGORIES } from "@/features/expenses";

import type { ExpenseFormState } from "./actions";

export function ExpenseForm({
  action,
  idPrefix = "expense",
  onSaved,
  members,
  myMemberId,
}: {
  action: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
  /** Keeps input ids unique when two forms share a page */
  idPrefix?: string;
  onSaved?: () => void;
  /** Person tags to choose from; leave out to tag only the signed-in person */
  members?: { id: number; nickname: string }[];
  myMemberId?: number;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    amount: "",
    label: "",
    saved: 0,
  });
  const invalid = !!state.error || undefined;
  useEffect(() => {
    if (state.saved > 0) onSaved?.();
  }, [state.saved, onSaved]);
  // Remount inputs after each result so they show the returned values.
  const key = `${state.saved}-${state.error ?? ""}`;

  return (
    <form action={formAction} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor={`${idPrefix}-amount`}>금액 (엔)</FieldLabel>
            <Input
              key={`a-${key}`}
              id={`${idPrefix}-amount`}
              name="amount"
              inputMode="numeric"
              placeholder="1,280"
              defaultValue={state.amount}
              aria-invalid={invalid}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-label`}>항목</FieldLabel>
            <Input
              key={`l-${key}`}
              id={`${idPrefix}-label`}
              name="label"
              placeholder="점심"
              maxLength={30}
              defaultValue={state.label}
            />
          </Field>
        </div>
        {members && (
          <>
            <Field>
              <FieldLabel>누구 몫인가요?</FieldLabel>
              <div className="flex flex-wrap gap-1.5" data-testid="expense-people">
                {members.map((m) => (
                  <TagChip key={`${key}-p${m.id}`} type="checkbox" name="people" value={m.id} defaultChecked={m.id === myMemberId}>
                    {m.nickname}
                  </TagChip>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>종류</FieldLabel>
              <div className="flex flex-wrap gap-1.5" data-testid="expense-category">
                {EXPENSE_CATEGORIES.map((c) => (
                  <TagChip key={`${key}-c${c.key}`} type="radio" name="category" value={c.key} defaultChecked={c.key === "etc"}>
                    {c.label}
                  </TagChip>
                ))}
              </div>
            </Field>
          </>
        )}
        <FieldError>{state.error}</FieldError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "기록하는 중…" : "여비 기록하기"}
        </Button>
      </FieldGroup>
    </form>
  );
}
