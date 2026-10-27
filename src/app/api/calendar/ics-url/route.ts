import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearCalendarIcsUrl,
  getCalendarConfigMeta,
  saveCalendarIcsUrl,
  validateIcsUrl,
} from "@/lib/secrets";

export async function GET() {
  const meta = await getCalendarConfigMeta();
  // Never return the URL itself — only whether it is set and the host.
  return NextResponse.json(meta);
}

const bodySchema = z.object({
  url: z.string(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validated = validateIcsUrl(parsed.data.url);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const { host } = await saveCalendarIcsUrl(validated.url);
    return NextResponse.json({
      ok: true,
      configured: true,
      source: "app" as const,
      host,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save link" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearCalendarIcsUrl();
  const meta = await getCalendarConfigMeta();
  return NextResponse.json({ ok: true, ...meta });
}
