import { NextResponse } from "next/server";
import { z } from "zod";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  eventId: z.string().min(1),
  moduleId: z.string().min(1),
  applyToSourceUid: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const store = await updateStore((s) => {
    const ev = s.academicEvents.find((e) => e.id === parsed.data.eventId);
    if (!ev) return s;

    const moduleExists = s.modules.some((m) => m.id === parsed.data.moduleId);
    if (!moduleExists) return s;

    if (parsed.data.applyToSourceUid) {
      s.moduleOverrides[ev.sourceUid] = parsed.data.moduleId;
      s.academicEvents = s.academicEvents.map((e) =>
        e.sourceUid === ev.sourceUid
          ? { ...e, moduleId: parsed.data.moduleId }
          : e
      );
    } else {
      s.moduleOverrides[ev.id] = parsed.data.moduleId;
      s.academicEvents = s.academicEvents.map((e) =>
        e.id === ev.id ? { ...e, moduleId: parsed.data.moduleId } : e
      );
    }
    return s;
  });

  const event = store.academicEvents.find((e) => e.id === parsed.data.eventId);
  if (!event) {
    return NextResponse.json({ error: "Event or module not found" }, { status: 404 });
  }

  return NextResponse.json({ event, moduleOverrides: store.moduleOverrides });
}
