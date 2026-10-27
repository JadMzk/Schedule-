import { NextResponse } from "next/server";
import { updateStore } from "@/lib/store";
import { nowLondon, toIso } from "@/lib/time";
import { updateTaskSchema } from "@/lib/tasks/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task" },
      { status: 400 }
    );
  }

  let found = false;
  const store = await updateStore((s) => {
    s.tasks = s.tasks.map((t) => {
      if (t.id !== id) return t;
      found = true;
      const { id: _id, ...rest } = parsed.data;
      return {
        ...t,
        ...Object.fromEntries(
          Object.entries(rest).map(([k, v]) => [k, v === null ? undefined : v])
        ),
        updatedAt: toIso(nowLondon()),
      };
    });
    return s;
  });

  if (!found) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    task: store.tasks.find((t) => t.id === id),
    tasks: store.tasks,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const store = await updateStore((s) => {
    s.tasks = s.tasks.filter((t) => t.id !== id);
    s.workSessions = s.workSessions.filter((w) => w.taskId !== id);
    return s;
  });
  return NextResponse.json({ ok: true, tasks: store.tasks });
}
