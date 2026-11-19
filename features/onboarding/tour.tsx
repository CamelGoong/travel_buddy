"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiCloseLine,
  RiEdit2Line,
  RiFolderLine,
  RiGroupLine,
  RiNotification3Line,
  RiPlaneFill,
  RiQuestionLine,
  RiRoadMapLine,
  RiWallet3Line,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { TOUR_STEPS, type TourIcon } from "./steps";

const ICONS: Record<TourIcon, React.ComponentType<{ className?: string }>> = {
  plane: RiPlaneFill,
  course: RiEdit2Line,
  prep: RiFolderLine,
  money: RiWallet3Line,
  nudge: RiNotification3Line,
  together: RiGroupLine,
  start: RiRoadMapLine,
};

/** Remembers on the account that the introduction was seen. Failures are ignored. */
async function markSeen() {
  try {
    await createClient().auth.updateUser({ data: { onboarded: true } });
  } catch {
    // The tour may show once more on the next visit; nothing else depends on it.
  }
}

/** One-card-at-a-time introduction in a glass dialog; closes with skip, Esc, or the last button. */
function TourDialog({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const primary = useRef<HTMLButtonElement>(null);
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;
  const Icon = ICONS[step.icon];

  useEffect(() => {
    primary.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.27_0.06_295/0.28)] p-4 backdrop-blur-sm"
      data-testid="tour"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Travel Buddy 소개"
        className="flex w-full max-w-sm flex-col gap-5 rounded-4xl border border-white/80 bg-white/70 p-6 shadow-[0_20px_50px_oklch(0.5_0.22_285/0.25),inset_0_1px_0_oklch(1_0_0/0.9)] backdrop-blur-2xl backdrop-saturate-150 supports-not-[backdrop-filter]:bg-white"
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-xs font-bold text-muted-foreground tabular-nums">
            {index + 1} / {TOUR_STEPS.length}
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="소개 닫기" onClick={onClose}>
            <RiCloseLine />
          </Button>
        </div>

        <div key={step.id} className="tour-step flex flex-col items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[linear-gradient(135deg,var(--primary-from),var(--primary-to))] text-primary-foreground shadow-[0_10px_24px_oklch(0.5_0.22_285/0.35)]">
            <Icon className="size-8" />
          </span>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-balance">{step.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          {step.points && (
            <ul className="flex w-full flex-col gap-1.5 text-left text-sm">
              {step.points.map((point) => (
                <li key={point} className="flex items-start gap-2 rounded-2xl bg-white/60 px-3 py-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-center gap-1.5" role="tablist" aria-label="소개 단계">
          {TOUR_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}단계`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/40",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <Button variant="ghost" onClick={onClose}>
              건너뛰기
            </Button>
          )}
          <span className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" onClick={() => setIndex(index - 1)}>
                이전
              </Button>
            )}
            <Button ref={primary} onClick={() => (last ? onClose() : setIndex(index + 1))}>
              {last ? "시작하기" : "다음"}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Shown automatically to an account that has not seen it; closing remembers that on the account. */
export function OnboardingTour() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <TourDialog
      onClose={() => {
        setOpen(false);
        void markSeen().then(() => router.refresh());
      }}
    />
  );
}

/** "앱 소개 보기": opens the same introduction again on demand. */
export function ReplayTour() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <RiQuestionLine data-icon="inline-start" />
        앱 소개 보기
      </Button>
      {open && <TourDialog onClose={() => setOpen(false)} />}
    </>
  );
}
