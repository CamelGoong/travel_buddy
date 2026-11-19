"use client";

import { useState, useTransition } from "react";
import { RiSparkling2Line } from "@remixicon/react";

import { Button } from "@/components/ui/button";

import { regenerateCourse } from "./course-actions";

/** "AI로 다시 짜기": asks once, then replaces the whole course; the owner only. */
export function RegenerateButton() {
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (pending) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        코스 다시 짜는 중…
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2" data-testid="regenerate">
      {asking ? (
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-sm text-muted-foreground">직접 고친 내용이 사라져요. 다시 짤까요?</p>
          <span className="flex gap-1">
            <Button
              size="sm"
              onClick={() => {
                setAsking(false);
                setMessage(null);
                startTransition(async () => setMessage(await regenerateCourse()));
              }}
            >
              다시 짜기
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
              취소
            </Button>
          </span>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAsking(true)}>
          <RiSparkling2Line data-icon="inline-start" />
          AI로 다시 짜기
        </Button>
      )}
      {message && (
        <p className="text-sm text-muted-foreground" role="status" data-testid="regenerate-message">
          {message}
        </p>
      )}
    </div>
  );
}
