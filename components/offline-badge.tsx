"use client";

import { useEffect, useState } from "react";
import { RiCheckboxCircleLine } from "@remixicon/react";

import { listStoredFiles } from "@/lib/offline-store";

/** "오프라인 저장됨" once this file is on the device; hidden otherwise. */
export function OfflineBadge({ fileId }: { fileId: number }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const files = await listStoredFiles();
        if (alive) setSaved(files.some((f) => f.id === fileId));
      } catch {
        if (alive) setSaved(false);
      }
    };
    void check();
    window.addEventListener("tb-offline-updated", check);
    return () => {
      alive = false;
      window.removeEventListener("tb-offline-updated", check);
    };
  }, [fileId]);

  if (!saved) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" data-testid="offline-saved">
      <RiCheckboxCircleLine className="size-3.5" aria-hidden />
      오프라인 저장됨
    </span>
  );
}
