import Link from "next/link";
import { RiArrowLeftSLine } from "@remixicon/react";

import { AppShell, HomeLink, PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getUserId } from "@/lib/supabase/server";
import { getOfflineManifest, getSharedFiles, getVault } from "@/features/documents/store";
import { OfflineSync } from "@/components/offline-sync";
import { getMembers } from "@/features/members/server";
import { RouteLine, tripStage } from "@/features/route-line";
import { buildCourse } from "@/features/trip";

import { loadTripContext } from "../context";
import { AddSlotForm } from "./add-slot-form";
import { SlotCard } from "./slot-card";

export default async function DocumentsPage() {
  const ctx = await loadTripContext("/trip/documents");
  const { trip, now, days } = ctx;
  const userId = (await getUserId())!;
  const [vault, sharedFiles, members, manifest] = await Promise.all([
    getVault(trip.id),
    getSharedFiles(trip.id),
    getMembers(trip.id),
    getOfflineManifest(trip.id),
  ]);
  const canShare = members.length > 1;
  const defaultKinds = new Set(vault.map((slot) => slot.kind));
  const extraShared = sharedFiles.filter((f) => !defaultKinds.has(f.slotKind) || f.slotKind === "custom");

  const courseNames = new Set(buildCourse(trip).flatMap((day) => day.places.map((p) => p.name)));
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
            files={slot.files.map((f) => ({ ...f, placeName: f.placeName && courseNames.has(f.placeName) ? f.placeName : null }))}
            sharedFiles={slot.kind === "custom" ? [] : sharedFiles.filter((f) => f.slotKind === slot.kind)}
            canShare={canShare}
            places={places}
          />
        ))}
      </div>
      {sharedFiles.some((f) => f.slotKind === "custom") && (
        <section className="flex flex-col gap-2 text-sm" data-testid="shared-custom">
          <h2 className="font-heading font-semibold">동반자가 함께 보여 준 기타 서류</h2>
          <ul className="flex flex-col gap-1.5">
            {extraShared.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <a href={`/trip/documents/file/${f.id}`} target="_blank" rel="noreferrer" className="truncate underline-offset-4 hover:underline">
                  {f.slotName} · {f.fileName}
                </a>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">올린 사람: {f.ownerNickname}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AddSlotForm />
      <OfflineSync manifest={manifest} />
    </AppShell>
  );
}
