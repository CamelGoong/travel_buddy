import { cn } from "@/lib/utils";

import type { RouteLineModel } from "./stages";

/**
 * Thin subway-map style progress band fixed to the top of the app
 * (docs/decisions/route-line.md). It only shows progress; it is not navigation.
 */
export function RouteLine({ model }: { model: RouteLineModel }) {
  const { stations, activeIndex, passedThrough, caption } = model;

  return (
    <div
      className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      data-testid="route-line"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-1.5 px-4 pt-2 pb-2.5">
        <p className="truncate text-xs font-medium text-primary" data-testid="route-line-caption">
          {caption}
        </p>
        {stations.length > 0 && (
          <ol className="flex items-start overflow-x-auto pb-0.5" aria-label="진행 노선도">
            {stations.map((station, i) => {
              const passed = i <= passedThrough;
              const active = i === activeIndex;
              return (
                <li
                  key={station.key}
                  className="flex min-w-12 flex-1 flex-col items-center gap-1"
                  aria-current={active ? "step" : undefined}
                  data-active={active || undefined}
                >
                  <div className="relative flex h-3 w-full items-center justify-center">
                    {i > 0 && (
                      <span
                        className={cn(
                          "absolute top-1/2 right-1/2 left-0 h-0.5 -translate-y-1/2",
                          passed ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    {i < stations.length - 1 && (
                      <span
                        className={cn(
                          "absolute top-1/2 right-0 left-1/2 h-0.5 -translate-y-1/2",
                          i < passedThrough ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative size-2.5 rounded-full border-2",
                        passed ? "border-primary bg-primary" : "border-border bg-background",
                        active && "size-3 ring-4 ring-primary/25 motion-safe:animate-pulse",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[0.65rem] leading-none whitespace-nowrap",
                      active ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {station.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
