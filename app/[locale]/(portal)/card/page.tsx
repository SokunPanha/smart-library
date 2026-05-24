import { requireMemberSession } from "@/lib/portalAuth";
import PortalCardPage from "@/components/portal/CardPage";

export default async function CardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireMemberSession(locale);
  return <PortalCardPage />;
}
