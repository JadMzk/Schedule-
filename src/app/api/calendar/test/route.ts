import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchIcsText } from "@/lib/ics/sync";
import { parseIcsFeed } from "@/lib/ics/parse";
import {
  getCalendarIcsUrl,
  safeHost,
  validateIcsUrl,
} from "@/lib/secrets";

const bodySchema = z.object({
  url: z.string().optional(),
});

/**
 * Tests connectivity to an ICS feed without logging the URL.
 * Uses the pasted URL if provided, otherwise the saved credential.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let url: string | null = null;
  if (parsed.data.url?.trim()) {
    const validated = validateIcsUrl(parsed.data.url);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    url = validated.url;
  } else {
    url = await getCalendarIcsUrl();
  }

  if (!url) {
    return NextResponse.json(
      { error: "No calendar link to test. Paste a URL first." },
      { status: 400 }
    );
  }

  const host = safeHost(url);

  try {
    const icsText = await fetchIcsText(url);
    if (
      !icsText.includes("BEGIN:VCALENDAR") &&
      !icsText.includes("BEGIN:VEVENT")
    ) {
      return NextResponse.json(
        {
          ok: false,
          host,
          error:
            "The server responded, but the content does not look like an ICS calendar.",
        },
        { status: 502 }
      );
    }

    const result = parseIcsFeed(icsText);
    return NextResponse.json({
      ok: true,
      host,
      eventCount: result.events.length,
      moduleCount: result.discoveredModules.length,
      message: `Connected to ${host ?? "calendar"}. Found ${result.events.length} events.`,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Connection timed out."
          : err.message
        : "Could not reach the calendar feed.";
    return NextResponse.json(
      { ok: false, host, error: message },
      { status: 502 }
    );
  }
}
