"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/** "이거 필요해?" suggestions under the checklist; nothing is added until the user taps. */
export function ChecklistSuggestions({
  suggestions,
  onAdd,
  onDismiss,
}: {
  suggestions: { id: number; label: string }[];
  onAdd: (id: number) => Promise<void>;
  onDismiss: (id: number) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2 border-t pt-4" data-testid="checklist-suggestions">
      <p className="text-sm font-medium text-muted-foreground">이거 필요해?</p>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2">
            <span>{s.label}</span>
            <span className="flex gap-1">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => onAdd(s.id))}
              >
                추가
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => startTransition(() => onDismiss(s.id))}
              >
                괜찮아요
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
