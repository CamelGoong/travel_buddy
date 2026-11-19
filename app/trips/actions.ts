"use server";

import { cookies } from "next/headers";

import { CURRENT_TRIP_COOKIE } from "@/features/trip";

/** Remembers which trip the trip screens show (the user's own trips only; others fall back to latest). */
export async function rememberTrip(tripId: number) {
  (await cookies()).set(CURRENT_TRIP_COOKIE, String(tripId), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
