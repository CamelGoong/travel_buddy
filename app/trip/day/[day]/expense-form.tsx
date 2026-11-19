"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { ExpenseFormState } from "./actions";

export function ExpenseForm({
  action,
}: {
  action: (prev: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    amount: "",
    label: "",
    saved: 0,
  });
  const invalid = !!state.error || undefined;
  // Remount inputs after each result so they show the returned values.
  const key = `${state.saved}-${state.error ?? ""}`;

  return (
    <form action={formAction} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-[1fr_1.2fr] gap-3">
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor="amount">금액 (엔)</FieldLabel>
            <Input
              key={`a-${key}`}
              id="amount"
              name="amount"
              inputMode="numeric"
              placeholder="1,280"
              defaultValue={state.amount}
              aria-invalid={invalid}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="label">항목</FieldLabel>
            <Input
              key={`l-${key}`}
              id="label"
              name="label"
              placeholder="점심"
              maxLength={30}
              defaultValue={state.label}
            />
          </Field>
        </div>
        <FieldError>{state.error}</FieldError>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "기록하는 중…" : "여비 기록하기"}
        </Button>
      </FieldGroup>
    </form>
  );
}
