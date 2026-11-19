"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  COMPANIONS,
  INTERESTS,
  MAX_INTERESTS,
  type CompanionKey,
  type InterestKey,
} from "@/features/ai-course";

function Chip({
  label,
  pressed,
  disabled,
  onClick,
}: {
  label: string;
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40",
        pressed ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

/** Companion (one, optional) and interests (up to three, optional), submitted with the form. */
export function CompanionChips() {
  const [companion, setCompanion] = useState<CompanionKey | null>(null);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="동행 유형">
      {companion && <input type="hidden" name="companion" value={companion} />}
      {COMPANIONS.map((c) => (
        <Chip
          key={c.key}
          label={c.label}
          pressed={companion === c.key}
          onClick={() => setCompanion(companion === c.key ? null : c.key)}
        />
      ))}
    </div>
  );
}

export function InterestChips() {
  const [picked, setPicked] = useState<InterestKey[]>([]);
  const full = picked.length >= MAX_INTERESTS;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="취향">
      {picked.map((key) => (
        <input key={key} type="hidden" name="interests" value={key} />
      ))}
      {INTERESTS.map((i) => {
        const on = picked.includes(i.key);
        return (
          <Chip
            key={i.key}
            label={i.label}
            pressed={on}
            disabled={!on && full}
            onClick={() =>
              setPicked(on ? picked.filter((k) => k !== i.key) : [...picked, i.key])
            }
          />
        );
      })}
    </div>
  );
}
