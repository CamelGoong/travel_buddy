"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Shows the first few rows and a "더 보기" button for the rest; short lists show everything. */
export function CollapsibleList({
  items,
  limit = 3,
  className,
  testId,
}: {
  items: ReactNode[];
  limit?: number;
  className?: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const hidden = items.length - limit;
  const visible = open || hidden <= 0 ? items : items.slice(0, limit);
  return (
    <div className="flex flex-col gap-2">
      <ul className={className} data-testid={testId}>
        {visible}
      </ul>
      {hidden > 0 && (
        <Button variant="ghost" size="sm" className="self-center" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "접기" : `${hidden}건 더 보기`}
        </Button>
      )}
    </div>
  );
}
