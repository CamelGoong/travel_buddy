import Link from "next/link";
import { RiArrowLeftSLine } from "@remixicon/react";

import { AppShell, HomeLink, PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/supabase/server";
import { getVault } from "@/features/documents/store";
import { RouteLine, tripStage } from "@/features/route-line";
import { buildCourse } from "@/features/trip";

import { loadTripContext } from "../context";
import { AddSlotForm } from "./add-slot-form";
import { SlotCard } from "./slot-card";

export default async function DocumentsPage() {
  const ctx = await loadTripContext("/trip/documents");
  const { trip, now, days } = ctx;
  const userId = (await getUserId())!;
  const vault = await getVault(trip.id);

  const places = buildCourse(trip).flatMap((day) =>
    day.places.map((p) => ({ name: p.name, label: `${day.dayNumber}일차 ${p.name}` })),
  );

  return (
    <AppShell
      routeLine={
        <RouteLine model={tripStage({ today: now.date, startDate: trip.startDate, dayCount: days })} />
      }
      header={
        <div className="flex flex-col gap-3">
          <div className="-ml-2 flex items-center gap-1">
            <HomeLink />
            <Link href="/trip" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <RiArrowLeftSLine data-icon="inline-start" />
              여행 전체
            </Link>
          </div>
          <PageHeader
            eyebrow="사진이나 PDF를 올려 두면 필요할 때 바로 꺼내 볼 수 있어요"
            title="서류 보관함"
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3" data-testid="vault">
        {vault.map((slot) => (
          <SlotCard
            key={slot.id}
            slotId={slot.id}
            tripId={trip.id}
            userId={userId}
            kind={slot.kind}
            name={slot.name}
            files={slot.files}
            places={places}
          />
        ))}
      </div>
      <AddSlotForm />
    </AppShell>
  );
}
