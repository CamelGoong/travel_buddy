import Link from "next/link";
import type { ReactNode } from "react";
import { RiHome5Line } from "@remixicon/react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Common page shell: the route line stays on top, content keeps one
 * phone-first column width and gutter.
 */
export function AppShell({
  routeLine,
  suggestion,
  header,
  children,
}: {
  routeLine?: ReactNode;
  /** Proactive suggestion floating just under the route line */
  suggestion?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      {(routeLine || suggestion) && (
        <div className="sticky top-0 z-20">
          {routeLine}
          {suggestion && (
            <div className="pointer-events-none absolute inset-x-0 top-full px-3 pt-2 *:pointer-events-auto">
              {suggestion}
            </div>
          )}
        </div>
      )}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-5 pb-12">
        {header}
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Always-available way back to the trip list (home). */
export function HomeLink({ className }: { className?: string }) {
  return (
    <Link href="/trips" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), className)}>
      <RiHome5Line data-icon="inline-start" />
      내 여행
    </Link>
  );
}
