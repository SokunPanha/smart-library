import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

const DEFAULTS: Record<string, string> = {
  libraryName: "បណ្ណាល័យ វិ.ហ.ស.ខ្ច",
  libraryNameKh: "បណ្ណាល័យ វិ.ហ.ស.ខ្ច",
  address: "",
  phone: "",
  email: "",
  loanDaysStudent: "14",
  loanDaysTeacher: "30",
  loanDaysPublic: "14",
  loanDaysResearcher: "30",
  finePerDay: "500",
  maxLoansPerMember: "5",
  maxRenewalsPerLoan: "2",
};

export async function GET() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return NextResponse.json(map);
}

export async function PATCH(req: Request) {
  const session = await auth();
  const body: Record<string, string> = await req.json();
  const ops = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(ops);
  if (session) {
    const keys = Object.keys(body).join(", ");
    await logActivity(session, "SETTINGS_UPDATED", `Updated settings: ${keys}`);
  }
  return NextResponse.json({ ok: true });
}
