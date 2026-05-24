import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const { classes } = await req.json() as { classes: { name: string; grade: string }[] };
  if (!Array.isArray(classes) || classes.length === 0) {
    return NextResponse.json({ error: "No classes provided." }, { status: 400 });
  }

  const targetGrades = [...new Set(classes.map((c) => c.grade))];
  const targetNames = new Set(classes.map((c) => c.name));

  // Load all DB classes for the affected grades (with member counts)
  const dbClasses = await prisma.class.findMany({
    where: { grade: { in: targetGrades } },
    select: { id: true, name: true, _count: { select: { members: true } } },
  });

  const existingNames = new Set(dbClasses.map((c) => c.name));

  // Create new ones that aren't in DB yet
  const toCreate = classes.filter((c) => !existingNames.has(c.name));
  if (toCreate.length > 0) {
    await prisma.class.createMany({
      data: toCreate.map((c) => ({ name: c.name, grade: c.grade })),
    });
  }

  // Delete DB classes in these grades that are no longer selected AND have no members
  const toDelete = dbClasses.filter(
    (c) => !targetNames.has(c.name) && c._count.members === 0
  );
  const skippedDelete = dbClasses.filter(
    (c) => !targetNames.has(c.name) && c._count.members > 0
  );
  if (toDelete.length > 0) {
    await prisma.class.deleteMany({ where: { id: { in: toDelete.map((c) => c.id) } } });
  }

  await logActivity(
    session,
    "CLASS_BULK_UPDATED",
    `Generated ${toCreate.length} classes, deleted ${toDelete.length} (skipped ${skippedDelete.length} with members)`
  );

  return NextResponse.json({
    created: toCreate.length,
    skipped: classes.length - toCreate.length,
    deleted: toDelete.length,
    skippedDelete: skippedDelete.length,
  });
}
