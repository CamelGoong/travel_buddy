"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { withIga, withRo } from "@/lib/korean";
import {
  formatEstimate,
  mapsDirectionsUrl,
  pickSuggestion,
  type Suggestion,
} from "@/features/suggestions";
import { skyLabel, WeatherSummary } from "@/features/weather";

import { recordExpenseFromPrompt, resolveSuggestion, togglePrepItem } from "./actions";
import { CheckRow } from "./check-row";
import { ExpenseForm } from "./day/[day]/expense-form";
import type { IslandData } from "./suggestions";
import { useLocation } from "./use-location";

/**
 * One proactive suggestion at a time, dropping in under the route line
 * (docs/decisions/suggestion-nudge.md). Nothing runs until the user says yes.
 */
export function SuggestionIsland({ data }: { data: IslandData }) {
  const router = useRouter();
  const { permission, location, request } = useLocation(data.devLocation);
  const [expanded, setExpanded] = useState(false);
  // Once something is resolved, the next suggestion waits for the next screen visit.
  const [closed, setClosed] = useState(false);

  const suggestion = useMemo(
    () =>
      pickSuggestion({
        nowDate: data.nowDate,
        nowTime: data.nowTime,
        todayIsTripDay: data.todayDay !== null,
        tomorrowIsTripDay: data.tomorrowDay !== null,
        onTodayDayScreen: data.onTodayDayScreen,
        todayPlaces: data.todayPlaces,
        spots: data.spots,
        location,
        permission,
        resolvedToday: new Set(data.resolvedToday),
        lastNearbyAt: data.lastNearbyAt,
      }),
    [data, location, permission],
  );

  const resolve = useCallback(
    (s: Suggestion) => {
      setClosed(true);
      void resolveSuggestion(s.kind, s.context);
    },
    [],
  );

  if (closed || !suggestion) return null;
  const view = describe(suggestion, data);
  if (!view) return null;

  const later = (label = "나중에") => (
    <Button variant="ghost" size="sm" onClick={() => resolve(suggestion)}>
      {label}
    </Button>
  );

  let body: ReactNode;
  switch (suggestion.kind) {
    case "morning": {
      const m = data.morning!;
      body = (
        <>
          <WeatherSummary forecast={m.forecast} />
          {m.outfit && <p className="text-sm font-medium">👕 {m.outfit}</p>}
          <PlaceList places={m.places} />
          <Actions>
            {later()}
            <Button
              size="sm"
              onClick={async () => {
                setClosed(true);
                await resolveSuggestion("morning", "");
                router.push(`/trip/day/${data.todayDay}`);
              }}
            >
              오늘 시작할게요
            </Button>
          </Actions>
        </>
      );
      break;
    }
    case "evening": {
      const e = data.evening!;
      body = (
        <>
          <p className="text-sm leading-relaxed">
            {e.places.length > 0
              ? e.places.map((p) => `${p.time} ${p.name}`).join(" → ")
              : "내일은 자유 일정이에요."}
          </p>
          <WeatherSummary forecast={e.forecast} />
          {e.prepItems.length > 0 ? (
            <FieldGroup className="gap-3" data-testid="prep-items">
              {e.prepItems.map((item) => (
                <CheckRow
                  key={item.key}
                  id={`prep-${item.key}`}
                  label={item.label}
                  defaultChecked={item.done}
                  onToggle={(done) =>
                    togglePrepItem(data.tripId, item.key, item.checklistItemId ?? null, done)
                  }
                />
              ))}
            </FieldGroup>
          ) : (
            <p className="text-sm text-muted-foreground">챙길 게 없어요. 푹 자요!</p>
          )}
          <Actions>
            {later("닫기")}
            <Button size="sm" onClick={() => resolve(suggestion)}>
              확인, 내일 봐요
            </Button>
          </Actions>
        </>
      );
      break;
    }
    case "next_place": {
      const { place, estimate } = suggestion;
      body = (
        <>
          <p className="text-sm text-muted-foreground">
            {estimate
              ? `지금 위치에서 ${estimate.mode === "walk" ? "걸어서" : "대중교통으로"} 약 ${estimate.minutes}분이에요. `
              : ""}
            {place.time} {place.name} 일정이에요.
          </p>
          <Actions>
            {later()}
            <Button
              size="sm"
              onClick={() => {
                window.open(mapsDirectionsUrl(place, "transit"), "_blank", "noopener");
                resolve(suggestion);
              }}
            >
              길 보여줘
            </Button>
          </Actions>
        </>
      );
      break;
    }
    case "nearby": {
      body = (
        <>
          <ul className="flex flex-col gap-2 text-sm" data-testid="nearby-spots">
            {suggestion.spots.map((s) => (
              <li key={s.key} className="flex items-center gap-3">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {s.meters < 1000 ? `${Math.round(s.meters / 10) * 10}m` : "1km"} · 도보 {s.walkMinutes}분
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-auto h-auto p-0"
                  onClick={() => {
                    window.open(mapsDirectionsUrl(s, "walking"), "_blank", "noopener");
                    resolve(suggestion);
                  }}
                >
                  길 보기
                </Button>
              </li>
            ))}
          </ul>
          <Actions>{later("괜찮아요")}</Actions>
        </>
      );
      break;
    }
    case "expense": {
      body = (
        <>
          <ExpenseForm
            idPrefix="prompt"
            action={recordExpenseFromPrompt.bind(null, suggestion.context)}
            onSaved={() => setClosed(true)}
          />
          <Actions>{later()}</Actions>
        </>
      );
      break;
    }
    case "location": {
      body = (
        <>
          <p className="text-sm text-muted-foreground">
            위치는 다음 장소까지 걸리는 시간과 근처 명소를 고를 때만 써요. 저장하지 않아요.
          </p>
          <Actions>
            {later()}
            <Button
              size="sm"
              onClick={() => {
                request();
                resolve(suggestion);
              }}
            >
              켜 볼게요
            </Button>
          </Actions>
        </>
      );
      break;
    }
  }

  return (
    <div
      className="nudge-island"
      data-testid="suggestion"
      data-kind={suggestion.kind}
      data-expanded={expanded || undefined}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 text-left text-sm"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="nudge-dot" aria-hidden />
        <span className="flex-1 leading-snug">{view.line}</span>
        <span className="shrink-0 font-heading text-xs font-semibold whitespace-nowrap text-primary">
          {view.meta}
        </span>
      </button>
      {expanded && <div className="mt-3 flex flex-col gap-3">{body}</div>}
    </div>
  );
}

function describe(s: Suggestion, data: IslandData): { line: string; meta: string } | null {
  switch (s.kind) {
    case "morning": {
      const f = data.morning?.forecast;
      if (!data.morning) return null;
      return {
        line: f
          ? `좋은 아침! 오늘 ${f.maxC}°, ${skyLabel(f.weatherCode)}. 코스 볼까요?`
          : `좋은 아침! 오늘은 ${data.todayDay}일차예요. 코스 볼까요?`,
        meta: `☀️ ${data.todayDay}일차`,
      };
    }
    case "evening": {
      if (!data.evening) return null;
      const first = data.evening.places[0];
      return {
        line: first
          ? `내일은 ${first.name} 가는 날! 챙길 것 볼까요?`
          : "내일은 자유 일정이에요. 챙길 것 볼까요?",
        meta: `🌙 ${data.tomorrowDay}일차`,
      };
    }
    case "next_place":
      return {
        line:
          s.trigger === "arrival"
            ? `다음은 ${s.place.name}! 슬슬 가 볼까요?`
            : `${withRo(s.place.name)} 슬슬 출발해 볼까요?`,
        meta: s.estimate ? formatEstimate(s.estimate) : `🕒 ${s.place.time}`,
      };
    case "nearby":
      return {
        line: `근처에 ${withIga(s.spots[0].name)} 있어요. 들러 볼까요?`,
        meta: `🚶 ${s.spots[0].walkMinutes}분`,
      };
    case "expense":
      return s.context === "lunch"
        ? { line: "점심 먹었어요? 기록해 둘까요?", meta: "🍜 점심" }
        : { line: "저녁 먹었어요? 기록해 둘까요?", meta: "🍽️ 저녁" };
    case "location":
      return { line: "근처 추천을 받으려면 위치가 필요해요. 켜 볼까요?", meta: "📍" };
  }
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-1.5">{children}</div>;
}

function PlaceList({ places }: { places: { name: string; time: string }[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {places.map((p) => (
        <li key={p.name} className="flex gap-3">
          <span className="font-heading text-muted-foreground tabular-nums">{p.time}</span>
          <span>{p.name}</span>
        </li>
      ))}
    </ul>
  );
}
