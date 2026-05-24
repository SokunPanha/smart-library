import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/portalAuth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  let map = await prisma.libraryMap.findFirst();
  if (!map) {
    map = await prisma.libraryMap.create({ data: { rows: 8, cols: 12, cells: [] } });
  }
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const adminAuth = await requireAdminApi();
  if (adminAuth.response) return adminAuth.response;
  const { session } = adminAuth;

  const body = await req.json();
  let map = await prisma.libraryMap.findFirst();
  if (!map) {
    map = await prisma.libraryMap.create({
      data: { rows: body.rows ?? 8, cols: body.cols ?? 12, cells: body.cells ?? [] },
    });
  } else {
    map = await prisma.libraryMap.update({
      where: { id: map.id },
      data: { rows: body.rows ?? map.rows, cols: body.cols ?? map.cols, cells: body.cells ?? map.cells },
    });
  }
  await logActivity(session, "LIBRARY_MAP_UPDATED", `Library map updated (${map.rows}×${map.cols})`, map.id);
  return NextResponse.json(map);
}
