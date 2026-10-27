import { NextResponse } from "next/server";
import { getCalendarConfigMeta } from "@/lib/secrets";
import { readStore } from "@/lib/store";
import { isLlmConfigured } from "@/lib/tasks/llm-parser";

export async function GET() {
  const store = await readStore();
  const calendar = await getCalendarConfigMeta();
  return NextResponse.json({
    ...store,
    meta: {
      calendarConfigured: calendar.configured,
      calendarSource: calendar.source,
      calendarHost: calendar.host,
      llmConfigured: isLlmConfigured(),
      timezone: "Europe/London",
    },
  });
}
