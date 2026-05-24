import { requireMemberSession } from "@/lib/portalAuth";
import PortalLoansPage from "@/components/portal/LoansPage";

export default async function LoansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireMemberSession(locale);
  return <PortalLoansPage />;
}
