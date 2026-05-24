import { requireMemberSession } from "@/lib/portalAuth";
import PortalBooksPage from "@/components/portal/BooksPage";

export default async function BooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireMemberSession(locale);
  return <PortalBooksPage />;
}
