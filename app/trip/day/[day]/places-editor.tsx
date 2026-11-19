"use client";

import { useState, useTransition } from "react";
import { RiArrowDownLine, RiArrowUpLine, RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_PLACE_NAME } from "@/features/trip/course-edit";

import { editDay, type CourseEdit } from "../../course-actions";

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
            aria-label="직접 입력한 장소 이름"
            placeholder="가고 싶은 곳 이름 (직접 입력)"
            maxLength={MAX_PLACE_NAME}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Button variant="outline" disabled={pending || typed.trim() === ""} onClick={() => run({ op: "add", name: typed }, () => setTyped(""))}>
            추가
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">직접 입력한 곳은 길찾기가 이름 검색으로 열리고, 도착 알림은 없어요.</p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert" data-testid="edit-error">
          {error}
        </p>
      )}
    </div>
  );
}
