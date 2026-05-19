import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let map = await prisma.libraryMap.findFirst();
  if (!map) {
    map = await prisma.libraryMap.create({ data: { rows: 8, cols: 12, cells: [] } });
  }
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  return NextResponse.json(map);
}
