import { RiCloudyFill, RiPlaneFill } from "@remixicon/react";

/**
 * Full-screen "taking off" screen shown while a trip opens, so the short wait
 * feels like the start of the trip instead of a frozen page.
 */
export function TakeoffScreen({ message = "오사카로 출발하는 중…" }: { message?: string }) {
  return (
    <div className="takeoff" role="status" aria-live="polite" data-testid="takeoff">
      <div className="takeoff-sky" aria-hidden>
        <RiCloudyFill className="takeoff-cloud takeoff-cloud-a" />
        <RiCloudyFill className="takeoff-cloud takeoff-cloud-b" />
        <div className="takeoff-trail" />
        <RiPlaneFill className="takeoff-plane" />
      </div>
      <p className="font-heading text-sm font-semibold text-primary">{message}</p>
      <p className="text-sm text-muted-foreground">곧 도착해요</p>
    </div>
  );
}
