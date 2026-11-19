"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_LABEL } from "@/features/checklist";

import { addChecklistItem, removeChecklistItem, toggleChecklistItem, type ItemFormState } from "./actions";
import { CheckRow } from "./check-row";

type ItemView = { id: number; key: string; label: string; done: boolean; removable: boolean };

/** The checklist rows; the owner can also add items and delete the ones that are not defaults. */
export function ChecklistEditor({ items, isOwner }: { items: ItemView[]; isOwner: boolean }) {
  const [askDelete, setAskDelete] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(addChecklistItem, {
    error: null,
    label: "",
    saved: 0,
  });

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup className="gap-3" data-testid="checklist">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <CheckRow
              id={`checklist-${item.key}`}
              label={item.label}
              defaultChecked={item.done}
              onToggle={toggleChecklistItem.bind(null, item.id)}
            />
            {isOwner &&
              item.removable &&
              (askDelete === item.id ? (
                <span className="flex shrink-0 gap-1">
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => {
                      setAskDelete(null);
                      startTransition(() => removeChecklistItem(item.id));
                    }}
                  >
                    지우기
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setAskDelete(null)}>
                    취소
                  </Button>
                </span>
              ) : (
                <Button size="xs" variant="ghost" onClick={() => setAskDelete(item.id)} aria-label={`${item.label} 지우기`}>
                  지우기
                </Button>
              ))}
          </div>
        ))}
      </FieldGroup>
      {isOwner && (
        <form action={formAction} noValidate className="flex flex-col gap-2" data-testid="checklist-add">
          <div className="flex gap-2">
            <Input
              id="checklist-new"
              name="label"
              placeholder="휴대폰 충전기"
              maxLength={MAX_LABEL}
              defaultValue={state.label}
              key={`new-${state.saved}-${state.error ?? ""}`}
              aria-label="항목 추가"
              aria-invalid={!!state.error || undefined}
            />
            <Button type="submit" variant="outline" disabled={pending}>
              추가
            </Button>
          </div>
          <FieldError>{state.error}</FieldError>
        </form>
      )}
    </div>
  );
}
