"use client";

import { useLinkStatus } from "next/link";
import { RiArrowRightSLine, RiLoader4Line } from "@remixicon/react";

/** Arrow inside a Link that turns into a spinner while the page is opening. */
export function LinkArrow() {
  const { pending } = useLinkStatus();
  return pending ? (
    <RiLoader4Line className="shrink-0 animate-spin text-primary" aria-label="여는 중" />
  ) : (
    <RiArrowRightSLine className="shrink-0 text-muted-foreground" aria-hidden />
  );
}
