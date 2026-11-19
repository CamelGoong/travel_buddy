"use client";

import { useCallback, useEffect, useState } from "react";

import type { DevLocation } from "@/lib/clock";
import type { LatLng, LocationPermission } from "@/features/suggestions";

/**
 * Browser location while the app is open. Never stored; used only for
 * distances. In development, a simulated location from `/dev/sim` wins.
 */
export function useLocation(dev: DevLocation | null) {
  const [permission, setPermission] = useState<LocationPermission>(dev?.permission ?? "unknown");
  const [location, setLocation] = useState<LatLng | null>(dev?.location ?? null);

  const locate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
    );
  }, []);

  useEffect(() => {
    if (dev || !("geolocation" in navigator)) return;
    let cancelled = false;
    // Only read the current permission here; the prompt itself waits for the user's yes.
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;
        setPermission(status.state);
        if (status.state === "granted") locate();
      })
      .catch(() => !cancelled && setPermission("prompt"));
    return () => {
      cancelled = true;
    };
  }, [dev, locate]);

  /** Called after the user said yes to the location suggestion. */
  const request = useCallback(() => {
    if (dev) {
      // Development stand-in for the browser prompt: allow at the simulated spot.
      document.cookie = "tb-dev-perm=granted; path=/";
      setPermission("granted");
      setLocation(dev.location);
      return;
    }
    if ("geolocation" in navigator) locate();
  }, [dev, locate]);

  return { permission, location: permission === "granted" ? location : null, request };
}
