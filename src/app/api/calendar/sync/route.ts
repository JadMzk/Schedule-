import { NextResponse } from "next/server";
import { syncCalendarFromEnv } from "@/lib/ics/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await syncCalendarFromEnv();
  return NextResponse.json(
    {
      ok: result.ok,
      error: result.error ?? null,
      sync: result.store.sync,
      eventCount: result.store.academicEvents.length,
      moduleCount: result.store.modules.length,
    },
    { status: result.ok ? 200 : 502 }
  );
}
