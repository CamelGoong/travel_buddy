import { NextResponse } from "next/server";

import { signedUrlOf } from "@/features/documents/store";

/** Opens an uploaded file through a one-hour signed link; only its owner gets one. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) return new NextResponse("Not found", { status: 404 });

  const url = await signedUrlOf(fileId);
  if (!url) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(url);
}
