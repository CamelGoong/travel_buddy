"use client";

import { useState, useTransition } from "react";
import { RiArrowDownLine, RiArrowUpLine, RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_PLACE_NAME } from "@/features/trip/course-edit";

import { editDay, searchPlaces, type CourseEdit, type PlaceCandidate } from "../../course-actions";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Owner-only editing of one day: move, retime, delete, and add places. Every change saves at once. */
export function PlacesEditor({
  dayNumber,
  places,
  spots,
}: {
  dayNumber: number;
  places: { name: string; time: string }[];
  /** Listed spots that are not already in this day */
  spots: { key: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [spotKey, setSpotKey] = useState("");
  const [typed, setTyped] = useState("");
  const [candidates, setCandidates] = useState<PlaceCandidate[] | null>(null);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();

  const run = (edit: CourseEdit, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const message = await editDay(dayNumber, edit);
      if (message) setError(message);
      else after?.();
    });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="places-editor">
      {places.length === 0 && <p className="text-muted-foreground">자유 일정이에요. 아래에서 장소를 더해 보세요.</p>}
      <ol className="flex flex-col gap-2">
        {places.map((p, i) => (
          <li key={`${p.name}-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg border px-2 py-2">
            <Input
              type="time"
              aria-label={`${p.name} 시각`}
              defaultValue={p.time}
              className="w-28"
              disabled={pending}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== p.time) run({ op: "time", index: i, time: e.target.value });
              }}
            />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="flex gap-1">
              <Button size="icon-xs" variant="ghost" aria-label={`${p.name} 위로`} disabled={pending || i === 0} onClick={() => run({ op: "up", index: i })}>
                <RiArrowUpLine />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`${p.name} 아래로`}
                disabled={pending || i === places.length - 1}
                onClick={() => run({ op: "down", index: i })}
              >
                <RiArrowDownLine />
              </Button>
              <Button size="icon-xs" variant="ghost" aria-label={`${p.name} 지우기`} disabled={pending} onClick={() => run({ op: "remove", index: i })}>
                <RiDeleteBinLine />
              </Button>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="text-sm font-medium text-muted-foreground">장소 추가</p>
        <div className="flex gap-2">
          <select aria-label="명소 목록" className={SELECT_CLASS} value={spotKey} onChange={(e) => setSpotKey(e.target.value)}>
            <option value="">명소 목록에서 고르기</option>
            {spots.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={pending || !spotKey}
            onClick={() => run({ op: "add", spotKey }, () => setSpotKey(""))}
          >
            추가
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            aria-label="찾을 장소 이름"
            placeholder="가고 싶은 곳 이름 (예: 이치란 도톤보리점)"
            maxLength={MAX_PLACE_NAME}
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setCandidates(null);
              setSearchNote(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("place-search")?.click();
              }
            }}
          />
          <Button
            id="place-search"
            variant="outline"
            disabled={pending || searching || typed.trim() === ""}
            onClick={() =>
              startSearch(async () => {
                setError(null);
                setSearchNote(null);
                const found = await searchPlaces(typed);
                if (!found.ok) {
                  setCandidates(null);
                  return setSearchNote(found.error);
                }
                setCandidates(found.results);
                if (found.results.length === 0) setSearchNote("검색 결과가 없어요. 이름만 추가할 수도 있어요.");
              })
            }
          >
            {searching ? "찾는 중…" : "위치 찾기"}
          </Button>
        </div>
        {candidates && candidates.length > 0 && (
          <ul className="flex flex-col gap-1.5" data-testid="place-candidates">
            {candidates.map((c) => (
              <li key={`${c.lat},${c.lng}`} className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 text-muted-foreground">{c.address}</span>
                <Button
                  size="xs"
                  disabled={pending}
                  onClick={() =>
                    run({ op: "add", name: typed, lat: c.lat, lng: c.lng }, () => {
                      setTyped("");
                      setCandidates(null);
                    })
                  }
                >
                  여기로 추가
                </Button>
              </li>
            ))}
          </ul>
        )}
        {searchNote && <p className="text-sm text-muted-foreground">{searchNote}</p>}
        {typed.trim() !== "" && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            disabled={pending}
            onClick={() => run({ op: "add", name: typed }, () => { setTyped(""); setCandidates(null); })}
          >
            위치 없이 이름만 추가
          </Button>
        )}
        <p className="text-xs text-muted-foreground">위치를 고르면 동선 지도와 도착 알림이 함께 동작해요. 이름만 넣으면 길찾기가 이름 검색으로 열려요.</p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert" data-testid="edit-error">
          {error}
        </p>
      )}
    </div>
  );
}
