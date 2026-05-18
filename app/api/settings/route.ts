import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  libraryName: "Cambodia Public Library",
  libraryNameKh: "បណ្ណាល័យសាធារណៈកម្ពុជា",
  address: "",
  phone: "",
  email: "",
  loanDaysStudent: "14",
  loanDaysTeacher: "30",
  loanDaysPublic: "14",
  loanDaysResearcher: "30",
  finePerDay: "500",
  maxLoansPerMember: "5",
};

export async function GET() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return NextResponse.json(map);
}

export async function PATCH(req: Request) {
  const body: Record<string, string> = await req.json();
  const ops = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
