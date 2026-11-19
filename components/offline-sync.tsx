"use client";

import { useEffect } from "react";

import {
  deleteStoredFile,
  listStoredFiles,
  MAX_TOTAL_BYTES,
  putStoredFile,
} from "@/lib/offline-store";

export type OfflineManifestEntry = { id: number; fileName: string; contentType: string; slotName: string };

/**
 * Keeps the files that should be available offline on this device: downloads the
 * missing ones while online and removes the ones that left the list.
 * Renders nothing; failures are silent and leave other behaviour untouched.
 */
export function OfflineSync({ manifest }: { manifest: OfflineManifestEntry[] }) {
  const key = manifest.map((m) => m.id).join(",");

  useEffect(() => {
    if (typeof indexedDB === "undefined" || !navigator.onLine) return;
    let cancelled = false;

    (async () => {
      try {
        const stored = await listStoredFiles();
        const wanted = new Set(manifest.map((m) => m.id));
        let changed = false;
        for (const file of stored) {
          if (!wanted.has(file.id)) {
            await deleteStoredFile(file.id);
            changed = true;
          }
        }
        let total = stored.filter((f) => wanted.has(f.id)).reduce((sum, f) => sum + f.blob.size, 0);
        const have = new Set(stored.map((f) => f.id));
        for (const entry of manifest) {
          if (cancelled) return;
          if (have.has(entry.id)) continue;
          const response = await fetch(`/trip/documents/file/${entry.id}`);
          if (!response.ok) continue;
          const blob = await response.blob();
          if (total + blob.size > MAX_TOTAL_BYTES) continue;
          await putStoredFile({
            id: entry.id,
            fileName: entry.fileName,
            contentType: entry.contentType,
            slotName: entry.slotName,
            blob,
          });
          total += blob.size;
          changed = true;
        }
        if (changed) window.dispatchEvent(new Event("tb-offline-updated"));
      } catch {
        // Offline or storage unavailable: try again on the next visit.
      }
    })();

    return () => {
      cancelled = true;
    };
    // The manifest is fully described by its ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
