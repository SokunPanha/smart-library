import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KioskPage } from "@/components/visitor-log/KioskPage";

export default async function KioskRoute({ params }: { params: Promise<{ locale: string }> }) {
  const session = await auth();
  const { locale } = await params;
  if (!session) redirect(`/${locale}/login`);
  return <KioskPage />;
}
