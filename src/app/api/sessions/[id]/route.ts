import { NextResponse } from "next/server";
import { z } from "zod";
import {
  collectBusyBlocks,
  hasConflict,
} from "@/lib/scheduling/free-time";
import { readStore, updateStore } from "@/lib/store";
import { categorySchema } from "@/lib/tasks/schema";
import { nowLondon, toIso } from "@/lib/time";

const patchSchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  title: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  category: categorySchema.optional().nullable(),
  status: z.enum(["suggested", "confirmed", "completed", "cancelled"]).optional(),
  allowConflict: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid session" },
      { status: 400 }
    );
  }

  const current = await readStore();
  const existing = current.workSessions.find((w) => w.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const nextStart = parsed.data.startAt ?? existing.startAt;
  const nextEnd = parsed.data.endAt ?? existing.endAt;
  if (nextEnd <= nextStart) {
    return NextResponse.json(
      { error: "Session end must be after start" },
      { status: 400 }
    );
  }

  if (parsed.data.startAt || parsed.data.endAt) {
    const selectedModuleIds = new Set(
      current.modules.filter((m) => m.isSelected).map((m) => m.id)
    );
    const busy = collectBusyBlocks({
      academicEvents: current.academicEvents,
      workSessions: current.workSessions.filter(
        (s) =>
          s.id !== id &&
          (s.status === "confirmed" || s.status === "suggested")
      ),
      selectedModuleIds,
      rangeStart: nextStart,
      rangeEnd: nextEnd,
    });
    if (!parsed.data.allowConflict && hasConflict(nextStart, nextEnd, busy)) {
      return NextResponse.json(
        {
          error:
            "That slot overlaps a class or existing session. Enable override to save anyway.",
          conflict: true,
        },
        { status: 409 }
      );
    }
  }

  let taskId: string | undefined = existing.taskId;
  const store = await updateStore((s) => {
    s.workSessions = s.workSessions.map((w) => {
      if (w.id !== id) return w;
      taskId = w.taskId;
      const next = { ...w };
      if (parsed.data.startAt !== undefined) next.startAt = parsed.data.startAt;
      if (parsed.data.endAt !== undefined) next.endAt = parsed.data.endAt;
      if (parsed.data.status !== undefined) next.status = parsed.data.status;
      if (parsed.data.title !== undefined) {
        next.title = parsed.data.title?.trim() || undefined;
      }
      if (parsed.data.taskId !== undefined) {
        next.taskId = parsed.data.taskId || undefined;
        taskId = next.taskId;
      }
      if (parsed.data.category !== undefined) {
        next.category = parsed.data.category || undefined;
      }
      return next;
    });

    if (parsed.data.status === "cancelled" && taskId) {
      const stillScheduled = s.workSessions.some(
        (w) =>
          w.taskId === taskId &&
          w.id !== id &&
          (w.status === "confirmed" || w.status === "suggested")
      );
      if (!stillScheduled) {
        s.tasks = s.tasks.map((t) =>
          t.id === taskId && t.status === "scheduled"
            ? { ...t, status: "todo", updatedAt: toIso(nowLondon()) }
            : t
        );
      }
    }

    if (parsed.data.status === "confirmed" && taskId) {
      s.tasks = s.tasks.map((t) =>
        t.id === taskId && t.status === "todo"
          ? { ...t, status: "scheduled", updatedAt: toIso(nowLondon()) }
          : t
      );
    }

    return s;
  });

  return NextResponse.json({
    session: store.workSessions.find((w) => w.id === id),
    workSessions: store.workSessions,
    tasks: store.tasks,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = await updateStore((s) => {
    const session = s.workSessions.find((w) => w.id === id);
    s.workSessions = s.workSessions.filter((w) => w.id !== id);
    if (session?.taskId) {
      const still = s.workSessions.some(
        (w) =>
          w.taskId === session.taskId &&
          (w.status === "confirmed" || w.status === "suggested")
      );
      if (!still) {
        s.tasks = s.tasks.map((t) =>
          t.id === session.taskId && t.status === "scheduled"
            ? { ...t, status: "todo", updatedAt: toIso(nowLondon()) }
            : t
        );
      }
    }
    return s;
  });
  return NextResponse.json({
    ok: true,
    workSessions: store.workSessions,
    tasks: store.tasks,
  });
}
