import { requireMemberSession } from "@/lib/portalAuth";
import PortalVisitsPage from "@/components/portal/VisitsPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireMemberSession(locale);
  return <PortalVisitsPage />;
}
