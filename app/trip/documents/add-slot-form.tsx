"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SLOT_NAME } from "@/features/documents";

import { addSlot, type SlotFormState } from "./actions";

/** "칸 추가": makes a named custom slot. */
export function AddSlotForm() {
  const [state, action, pending] = useActionState<SlotFormState, FormData>(addSlot, {
    error: null,
    name: "",
  });

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          key={state.name}
          name="name"
          defaultValue={state.name}
          placeholder="예: 국제운전면허증"
          aria-label="새 칸 이름"
          aria-invalid={state.error ? true : undefined}
          maxLength={MAX_SLOT_NAME + 10}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          칸 추가
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
