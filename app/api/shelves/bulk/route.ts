import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const bulkSchema = z.object({
  shelves: z.array(z.object({
    code: z.string().min(1),
    cabinet: z.string().min(1),
    side: z.string().optional().nullable(),
    shelfNo: z.number().int().min(1),
    sectionNo: z.number().int().min(1),
    zone: z.string().optional().nullable(),
    label: z.string().optional().nullable(),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const codes = parsed.data.shelves.map((s) => s.code);
  const existing = await prisma.shelf.findMany({ where: { code: { in: codes } }, select: { code: true } });
  const existingCodes = new Set(existing.map((s) => s.code));
  const toCreate = parsed.data.shelves.filter((s) => !existingCodes.has(s.code));

  if (toCreate.length > 0) {
    await prisma.shelf.createMany({ data: toCreate });
    const cabinet = toCreate[0].cabinet;
    const desc = `Bulk created ${toCreate.length} shelf(ves) for cabinet ${cabinet}` +
      (existingCodes.size > 0 ? ` (${existingCodes.size} skipped)` : "");
    await logActivity(session, "SHELF_BULK_CREATED", desc);
  }

  return NextResponse.json({ created: toCreate.length, skipped: existingCodes.size });
}
