"use client";

import { useEffect } from "react";

/** Registers the offline service worker (secure origins and localhost only). */
export function RegisterOffline() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline documents just stay unavailable.
    });
  }, []);
  return null;
}
