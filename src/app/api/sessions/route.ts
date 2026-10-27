import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  collectBusyBlocks,
  hasConflict,
} from "@/lib/scheduling/free-time";
import { readStore, updateStore } from "@/lib/store";
import { nowLondon, toIso } from "@/lib/time";
import { categorySchema } from "@/lib/tasks/schema";
import type { TaskCategory, WorkSession } from "@/lib/types";

const createSchema = z
  .object({
    taskId: z.string().min(1).optional().nullable(),
    title: z.string().optional().nullable(),
    category: categorySchema.optional().nullable(),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    status: z
      .enum(["suggested", "confirmed", "completed", "cancelled"])
      .default("confirmed"),
    allowConflict: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.taskId && !data.title?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Provide a title for a standalone block, or link a task.",
        path: ["title"],
      });
    }
  });

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ workSessions: store.workSessions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid session" },
      { status: 400 }
    );
  }

  const current = await readStore();
  const taskId = parsed.data.taskId ?? undefined;
  const title = parsed.data.title?.trim() || undefined;
  let category: TaskCategory | undefined =
    parsed.data.category ?? undefined;

  if (taskId) {
    const task = current.tasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (!category) category = task.category;
  }
  if (!category) category = "personal";

  if (parsed.data.endAt <= parsed.data.startAt) {
    return NextResponse.json(
      { error: "Session end must be after start" },
      { status: 400 }
    );
  }

  const selectedModuleIds = new Set(
    current.modules.filter((m) => m.isSelected).map((m) => m.id)
  );
  const busy = collectBusyBlocks({
    academicEvents: current.academicEvents,
    workSessions: current.workSessions.filter(
      (s) => s.status === "confirmed" || s.status === "suggested"
    ),
    selectedModuleIds,
    rangeStart: parsed.data.startAt,
    rangeEnd: parsed.data.endAt,
  });

  if (
    !parsed.data.allowConflict &&
    hasConflict(parsed.data.startAt, parsed.data.endAt, busy)
  ) {
    return NextResponse.json(
      {
        error:
          "That slot overlaps a class or existing session. Enable override to save anyway.",
        conflict: true,
      },
      { status: 409 }
    );
  }

  const session: WorkSession = {
    id: randomUUID(),
    taskId,
    title,
    category,
    startAt: parsed.data.startAt,
    endAt: parsed.data.endAt,
    status: parsed.data.status,
  };

  const store = await updateStore((s) => {
    s.workSessions.push(session);
    if (taskId) {
      s.tasks = s.tasks.map((t) =>
        t.id === taskId && t.status === "todo"
          ? { ...t, status: "scheduled", updatedAt: toIso(nowLondon()) }
          : t
      );
    }
    return s;
  });

  return NextResponse.json(
    { session, workSessions: store.workSessions, tasks: store.tasks },
    { status: 201 }
  );
}
