import { RiLoader4Line } from "@remixicon/react";

/** Shown at once when a day is tapped, until that day's page is ready. */
export default function DayLoading() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="h-1 w-full overflow-hidden bg-muted" aria-hidden>
        <div className="day-loading-bar h-full w-1/3 bg-primary" />
      </div>
      <div
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-4"
        role="status"
        aria-live="polite"
        data-testid="day-loading"
      >
        <RiLoader4Line className="size-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">코스 불러오는 중…</p>
      </div>
    </div>
  );
}
