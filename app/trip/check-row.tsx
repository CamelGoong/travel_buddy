"use client";

import { useState, useTransition } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

/** One checkable row whose state is saved through a server action. */
export function CheckRow({
  id,
  label,
  defaultChecked,
  onToggle,
}: {
  id: string;
  label: string;
  defaultChecked: boolean;
  onToggle: (done: boolean) => Promise<void>;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const [, startTransition] = useTransition();

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => {
          setChecked(next);
          startTransition(() => onToggle(next));
        }}
      />
      <FieldLabel htmlFor={id} className={checked ? "text-muted-foreground line-through" : undefined}>
        {label}
      </FieldLabel>
    </Field>
  );
}
