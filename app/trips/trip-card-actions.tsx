"use client";

import { useActionState, useState, useTransition } from "react";
import { RiDeleteBinLine, RiEdit2Line } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteTrip, renameTrip, type RenameState } from "./actions";

const MAX_TRIP_NAME = 20;

/** Rename and delete for a trip the signed-in account owns; delete asks once first. */
export function TripCardActions({ tripId, name, title }: { tripId: number; name: string | null; title: string }) {
  const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, renaming] = useActionState<RenameState, FormData>(
    async (prev, formData) => {
      const next = await renameTrip(tripId, prev, formData);
      if (!next.error) setMode("idle");
      return next;
    },
    { error: null, saved: 0 },
  );

  if (mode === "rename") {
    return (
      <form action={formAction} noValidate className="flex flex-col gap-2 px-1" data-testid="trip-rename">
        <div className="flex gap-2">
          <Input
            name="name"
            aria-label="여행 이름"
            placeholder={title}
            defaultValue={name ?? ""}
            maxLength={MAX_TRIP_NAME}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={renaming}>
            저장
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
            취소
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">비워서 저장하면 기본 이름으로 돌아가요.</p>
        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
      </form>
    );
  }

  if (mode === "delete") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-white/60 p-3" data-testid="trip-delete">
        <p className="text-sm">
          <b>{title}</b>과 안의 코스, 체크리스트, 여비, 서류가 모두 지워지고, 함께하는 사람도 더 이상 볼 수 없어요. 되돌릴 수
          없어요.
        </p>
        {deleteError && (
          <p className="text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        )}
        <span className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const message = await deleteTrip(tripId);
                if (message) setDeleteError(message);
              })
            }
          >
            {pending ? "지우는 중…" : "지우기"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>
            취소
          </Button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <Button size="xs" variant="ghost" onClick={() => setMode("rename")}>
        <RiEdit2Line data-icon="inline-start" />
        이름 바꾸기
      </Button>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => {
          setDeleteError(null);
          setMode("delete");
        }}
      >
        <RiDeleteBinLine data-icon="inline-start" />
        삭제
      </Button>
    </div>
  );
}
