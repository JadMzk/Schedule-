import { NextResponse } from "next/server";
import { getCalendarConfigMeta } from "@/lib/secrets";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const calendar = await getCalendarConfigMeta();
  return NextResponse.json({
    ...calendar,
    sync: store.sync,
    eventCount: store.academicEvents.length,
    moduleCount: store.modules.length,
  });
}
