import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const bulkSchema = z.object({
  shelves: z.array(z.object({
    code: z.string().min(1),
    cabinet: z.string().optional().nullable(),
    level: z.number().int().optional().nullable(),
    block: z.number().int().optional().nullable(),
    label: z.string().optional().nullable(),
    section: z.string().optional().nullable(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const codes = parsed.data.shelves.map((s) => s.code);
  const existing = await prisma.shelf.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const existingCodes = new Set(existing.map((s) => s.code));
  const toCreate = parsed.data.shelves.filter((s) => !existingCodes.has(s.code));

  if (toCreate.length > 0) {
    await prisma.shelf.createMany({ data: toCreate });
  }

  return NextResponse.json({ created: toCreate.length, skipped: existingCodes.size });
}
