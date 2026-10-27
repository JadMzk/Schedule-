import { NextResponse } from "next/server";
import { z } from "zod";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isSelected: z.boolean().optional(),
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
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
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const store = await updateStore((s) => {
    s.modules = s.modules.map((m) => {
      if (m.id !== id) return m;
      return {
        ...m,
        isSelected: parsed.data.isSelected ?? m.isSelected,
        name: parsed.data.name ?? m.name,
        code:
          parsed.data.code === null
            ? undefined
            : (parsed.data.code ?? m.code),
        classificationSource:
          parsed.data.name || parsed.data.code !== undefined
            ? "manual"
            : m.classificationSource,
      };
    });
    return s;
  });

  const mod = store.modules.find((m) => m.id === id);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  return NextResponse.json({ module: mod });
}
