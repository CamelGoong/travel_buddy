import { NextResponse } from "next/server";

import { CURRENT_TRIP_COOKIE } from "@/features/trip";

/** Opens a trip from the list: remembers it, then shows the trip screen. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tripId = Number(id);
  const response = NextResponse.redirect(new URL("/trip", request.url));
  if (Number.isInteger(tripId) && tripId > 0) {
    response.cookies.set(CURRENT_TRIP_COOKIE, String(tripId), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
