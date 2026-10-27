import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readStore, updateStore } from "@/lib/store";
import { nowLondon, toIso } from "@/lib/time";
import { createTaskSchema } from "@/lib/tasks/schema";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ tasks: store.tasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task" },
      { status: 400 }
    );
  }

  const now = toIso(nowLondon());
  const task: Task = {
    id: randomUUID(),
    title: parsed.data.title,
    originalInput: parsed.data.originalInput || parsed.data.title,
    description: parsed.data.description || "",
    dueAt: parsed.data.dueAt ?? undefined,
    estimatedDurationMinutes: parsed.data.estimatedDurationMinutes ?? undefined,
    preferredStartAt: parsed.data.preferredStartAt ?? undefined,
    schedulingWindow: parsed.data.schedulingWindow ?? undefined,
    priority: parsed.data.priority,
    category: parsed.data.category,
    status: parsed.data.status,
    recurrenceRule: parsed.data.recurrenceRule ?? undefined,
    createdAt: now,
    updatedAt: now,
  };

  const store = await updateStore((s) => {
    s.tasks.push(task);
    return s;
  });

  return NextResponse.json({ task, tasks: store.tasks }, { status: 201 });
}
