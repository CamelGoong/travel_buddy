import { formatWonApprox } from "@/features/fx";

/** A small reference amount in won next to a yen amount; renders nothing without a rate. */
export function Won({ yen, rate }: { yen: number; rate: number | null | undefined }) {
  if (!rate) return null;
  return (
    <span className="ml-1 text-xs font-normal text-muted-foreground tabular-nums" data-testid="won">
      {formatWonApprox(yen, rate)}
    </span>
  );
}
