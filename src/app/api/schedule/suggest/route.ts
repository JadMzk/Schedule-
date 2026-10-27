import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestForUnscheduledTasks, suggestSlotsForTask } from "@/lib/scheduling/suggest";
import { readStore } from "@/lib/store";
import { nowLondon, toIso } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  taskId: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    taskId: url.searchParams.get("taskId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const store = await readStore();
  const nowIso = toIso(nowLondon());

  if (parsed.data.taskId) {
    const task = store.tasks.find((t) => t.id === parsed.data.taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (!task.estimatedDurationMinutes) {
      return NextResponse.json({
        suggestions: [],
        message:
          "Add an estimated duration before the scheduler can suggest a work session.",
      });
    }
    const suggestions = suggestSlotsForTask({
      task,
      academicEvents: store.academicEvents,
      workSessions: store.workSessions,
      modules: store.modules,
      nowIso,
    });
    return NextResponse.json({ suggestions });
  }

  const suggestions = suggestForUnscheduledTasks({
    tasks: store.tasks,
    academicEvents: store.academicEvents,
    workSessions: store.workSessions,
    modules: store.modules,
    nowIso,
  });

  return NextResponse.json({ suggestions });
}
