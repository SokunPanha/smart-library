import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activityLog";

export const DEFAULTS: Record<string, string> = {
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

// Keys whose values must be positive integers
const NUMERIC_KEYS = new Set([
  "loanDaysStudent", "loanDaysTeacher", "loanDaysPublic", "loanDaysResearcher",
  "finePerDay", "maxLoansPerMember", "maxRenewalsPerLoan",
]);

export async function GET() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return NextResponse.json(map);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();

  // Whitelist: only known keys are accepted
  const unknownKeys = Object.keys(body).filter((k) => !(k in DEFAULTS));
  if (unknownKeys.length > 0) {
    return NextResponse.json({ error: `Unknown setting key(s): ${unknownKeys.join(", ")}` }, { status: 422 });
  }

  // Validate numeric keys are positive integers
  for (const [key, value] of Object.entries(body)) {
    if (NUMERIC_KEYS.has(key)) {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1) {
        return NextResponse.json({ error: `${key} must be a positive integer` }, { status: 422 });
      }
    }
  }

  const ops = Object.entries(body).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  );
  await prisma.$transaction(ops);
  const keys = Object.keys(body).join(", ");
  await logActivity(session, "SETTINGS_UPDATED", `Updated settings: ${keys}`);
  return NextResponse.json({ ok: true });
}
