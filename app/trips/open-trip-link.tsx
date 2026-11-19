"use client";

import { useEffect, useState, type ReactNode } from "react";

import { TakeoffScreen } from "@/components/takeoff-screen";

/**
 * A plain anchor: opening a trip is a route handler that sets a cookie and
 * redirects, so it must be a full page navigation, not a client-side one.
 * The takeoff screen covers the wait until the new page replaces this one.
 */
export function OpenTripLink({ tripId, children }: { tripId: number; children: ReactNode }) {
  const [leaving, setLeaving] = useState(false);

  // Coming back through the browser's back button restores this page as it was.
  useEffect(() => {
    const reset = () => setLeaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <>
      <a
        href={`/trips/${tripId}`}
        onClick={(e) => {
          // Let new-tab clicks (ctrl/cmd/middle) behave normally.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          setLeaving(true);
        }}
        className="block w-full rounded-xl text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {children}
      </a>
      {leaving && <TakeoffScreen />}
    </>
  );
}
