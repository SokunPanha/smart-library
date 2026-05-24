import { requireMemberSession } from "@/lib/portalAuth";
import PortalDashboardPage from "@/components/portal/DashboardPage";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireMemberSession(locale);
  return <PortalDashboardPage />;
}
