"use client";

import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiExternalLinkLine } from "@remixicon/react";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";

export type RoutePlace = { index: number; name: string; time: string; lat: number; lng: number };
export type RouteLeg = { from: number; to: number; text: string };

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Draws the day's places as numbered purple pins joined by a dashed line on
 * OpenStreetMap tiles. The small version is a still picture; the large one pans and zooms.
 */
function LeafletRoute({ places, interactive }: { places: RoutePlace[]; interactive: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const key = places.map((p) => `${p.index}:${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let remove: (() => void) | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el) return;
      const map = L.map(el, {
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: interactive,
        attributionControl: interactive,
      });
      L.tileLayer(TILES, { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      const points = places.map((p) => L.latLng(p.lat, p.lng));
      if (points.length > 1) {
        L.polyline(points, { color: "#6d4fe8", weight: interactive ? 4 : 3, dashArray: "6 8", opacity: 0.9 }).addTo(map);
      }
      places.forEach((p) => {
        L.marker([p.lat, p.lng], {
          interactive: false,
          icon: L.divIcon({
            className: "",
            html: `<span class="tb-pin${interactive ? " tb-pin-lg" : ""}">${p.index}</span>`,
            iconSize: interactive ? [28, 28] : [22, 22],
            iconAnchor: interactive ? [14, 14] : [11, 11],
          }),
        }).addTo(map);
      });
      map.fitBounds(L.latLngBounds(points), { padding: interactive ? [28, 28] : [14, 14], maxZoom: 16 });
      remove = () => map.remove();
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
    // The places are fully described by their key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, interactive]);

  return <div ref={box} className="size-full" />;
}

/** The small map beside the day's list; tapping it opens the larger one. */
export function RouteMap({
  places,
  legs,
  routeUrl,
}: {
  places: RoutePlace[];
  legs: RouteLeg[];
  routeUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="하루 동선 지도 크게 보기"
        data-testid="route-mini"
        className="relative isolate size-28 shrink-0 overflow-hidden rounded-2xl border border-white/90 bg-white shadow-[0_6px_16px_oklch(0.5_0.22_285/0.2)]"
      >
        <span className="pointer-events-none block size-full">
          <LeafletRoute places={places} interactive={false} />
        </span>
        <span className="absolute inset-x-0 bottom-0 z-[500] bg-[oklch(0.27_0.06_295/0.7)] py-0.5 text-center text-[10px] text-white">
          눌러서 크게
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[oklch(0.27_0.06_295/0.3)] p-3 backdrop-blur-sm sm:items-center"
          data-testid="route-sheet"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="하루 동선 지도"
            className="flex w-full max-w-md flex-col gap-3 rounded-4xl border border-white/80 bg-white/80 p-4 shadow-[0_20px_50px_oklch(0.5_0.22_285/0.25)] backdrop-blur-2xl supports-not-[backdrop-filter]:bg-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-extrabold">하루 동선</h2>
              <Button variant="ghost" size="icon-sm" aria-label="지도 닫기" onClick={() => setOpen(false)}>
                <RiCloseLine />
              </Button>
            </div>
            <div className="isolate h-72 overflow-hidden rounded-3xl border border-white/90">
              <LeafletRoute places={places} interactive />
            </div>
            <ol className="flex flex-col gap-1.5 text-sm">
              {places.map((p, i) => (
                <li key={p.index} className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary-from),var(--primary-to))] text-[11px] font-extrabold text-primary-foreground">
                      {p.index}
                    </span>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{p.time}</span>
                  </span>
                  {legs[i] && <span className="pl-7 text-xs text-muted-foreground">↓ {legs[i].text}</span>}
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-muted-foreground">이동 시간은 직선 거리로 어림한 값이에요.</p>
            {routeUrl && (
              <a
                href={routeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(120deg,var(--primary-from),var(--primary-to))] px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <RiExternalLinkLine className="size-4" />
                구글지도에서 길찾기
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
