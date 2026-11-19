"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { createTrip, type CreateTripState } from "./actions";

export function CreateTripForm({ defaultStart }: { defaultStart: string }) {
  const [state, formAction, pending] = useActionState<CreateTripState, FormData>(createTrip, {
    error: null,
    startDate: defaultStart,
    endDate: "",
  });
  const invalid = !!state.error || undefined;

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel>도시</FieldLabel>
          <p className="font-medium">🇯🇵 오사카</p>
          <FieldDescription>지금은 오사카 여행만 만들 수 있어요.</FieldDescription>
        </Field>
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor="startDate">시작일</FieldLabel>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={state.startDate}
            key={`s-${state.startDate}`}
            aria-invalid={invalid}
          />
        </Field>
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor="endDate">종료일</FieldLabel>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={state.endDate}
            key={`e-${state.endDate}`}
            aria-invalid={invalid}
          />
          <FieldDescription>최대 14일까지 만들 수 있어요.</FieldDescription>
          <FieldError>{state.error}</FieldError>
        </Field>
        <Field data-invalid={!!state.budgetError || undefined}>
          <FieldLabel htmlFor="budget">예산 (엔, 선택)</FieldLabel>
          <Input
            id="budget"
            name="budget"
            inputMode="numeric"
            placeholder="80,000"
            defaultValue={state.budget ?? ""}
            key={`b-${state.budget ?? ""}`}
            aria-invalid={!!state.budgetError || undefined}
          />
          <FieldDescription>여행 전체에 쓸 돈이에요. 나중에 정해도 돼요.</FieldDescription>
          <FieldError>{state.budgetError}</FieldError>
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "코스 짜는 중…" : "여행 만들기"}
        </Button>
      </FieldGroup>
    </form>
  );
}
