import { NextResponse } from "next/server";
import { z } from "zod";
import { parseTask } from "@/lib/tasks/llm-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  text: z.string().min(1, "Enter a task description"),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const draft = await parseTask(parsed.data.text);
  return NextResponse.json({ draft });
}
