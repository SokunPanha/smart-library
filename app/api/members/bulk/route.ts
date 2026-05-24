import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLog";

const rowSchema = z.object({
  nameKh: z.string().optional().nullable(),
  nameEn: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  type: z.enum(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"]).default("STUDENT"),
  className: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")).or(z.null()),
  expiresAt: z.string().optional().nullable(),
});

const bulkSchema = z.object({
  members: z.array(rowSchema).min(1).max(1000),
});

function generateMemberId(existing: Set<string>, counter: { n: number }, year: number): string {
  let candidate = `MEM-${year}-${String(counter.n).padStart(4, "0")}`;
  while (existing.has(candidate)) {
    counter.n++;
    candidate = `MEM-${year}-${String(counter.n).padStart(4, "0")}`;
  }
  existing.add(candidate);
  counter.n++;
  return candidate;
}

export async function POST(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const actor = (session.user as { name?: string; email?: string }).name ?? session.user?.email ?? "unknown";

  // Pre-load existing memberIds to detect duplicates
  const incomingIds = parsed.data.members.map((m) => m.memberId).filter((id): id is string => !!id);
  const existingIds = new Set(
    incomingIds.length
      ? (await prisma.member.findMany({ where: { memberId: { in: incomingIds } }, select: { memberId: true } })).map((m) => m.memberId)
      : []
  );

  // Pre-load all class names for batch lookup
  const classNames = [...new Set(parsed.data.members.map((m) => m.className).filter((n): n is string => !!n))];
  const classMap = new Map<string, string>();
  if (classNames.length) {
    const classes = await prisma.class.findMany({ where: { name: { in: classNames } }, select: { id: true, name: true } });
    for (const c of classes) classMap.set(c.name, c.id);
  }

  // Pre-fetch count once so generateMemberId doesn't hit DB per row
  const year = new Date().getFullYear();
  const dbCount = await prisma.member.count();
  const idCounter = { n: dbCount + 1 };
  const generatedIds = new Set<string>(
    // Seed with all existing IDs that match this year's pattern to avoid collisions
    (await prisma.member.findMany({
      where: { memberId: { startsWith: `MEM-${year}-` } },
      select: { memberId: true },
    })).map((m) => m.memberId)
  );
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of parsed.data.members) {
    const name = row.nameKh || row.nameEn;
    if (!name) {
      errors.push(`Row skipped: no name provided`);
      skipped++;
      continue;
    }

    if (row.memberId && existingIds.has(row.memberId)) {
      skipped++;
      continue;
    }

    try {
      const memberId = row.memberId && !existingIds.has(row.memberId)
        ? row.memberId
        : generateMemberId(generatedIds, idCounter, year);

      if (row.memberId) existingIds.add(row.memberId);

      await prisma.member.create({
        data: {
          memberId,
          nameKh: row.nameKh || null,
          nameEn: row.nameEn || null,
          type: row.type,
          phone: row.phone || null,
          email: row.email || null,
          expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
          classId: row.className ? (classMap.get(row.className) ?? null) : null,
          createdBy: actor,
          updatedBy: actor,
        },
      });
      created++;
    } catch {
      errors.push(`Failed to import: ${name}`);
      skipped++;
    }
  }

  await logActivity(session, "MEMBERS_BULK_IMPORTED", `Bulk imported ${created} member(s), skipped ${skipped}`);
  return NextResponse.json({ created, skipped, errors });
}
