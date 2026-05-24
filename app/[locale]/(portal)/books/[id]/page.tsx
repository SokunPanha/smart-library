import { requireMemberSession } from "@/lib/portalAuth";
import PortalBookDetailPage from "@/components/portal/BookDetailPage";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireMemberSession(locale);
  return <PortalBookDetailPage id={id} />;
}
