import { NextResponse } from "next/server";
import { z } from "zod";
import { readStore, updateStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ modules: store.modules });
}

const bulkSchema = z.object({
  action: z.enum(["select_all", "clear_all", "set"]),
  selectedIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const store = await updateStore((s) => {
    if (parsed.data.action === "select_all") {
      s.modules = s.modules.map((m) => ({ ...m, isSelected: true }));
    } else if (parsed.data.action === "clear_all") {
      s.modules = s.modules.map((m) => ({ ...m, isSelected: false }));
    } else if (parsed.data.action === "set" && parsed.data.selectedIds) {
      const set = new Set(parsed.data.selectedIds);
      s.modules = s.modules.map((m) => ({
        ...m,
        isSelected: set.has(m.id),
      }));
    }
    return s;
  });

  return NextResponse.json({ modules: store.modules });
}
