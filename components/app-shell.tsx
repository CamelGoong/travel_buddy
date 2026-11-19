import type { ReactNode } from "react";

/**
 * Common page shell: the route line stays on top, content keeps one
 * phone-first column width and gutter.
 */
export function AppShell({
  routeLine,
  header,
  children,
}: {
  routeLine?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      {routeLine}
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
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}
