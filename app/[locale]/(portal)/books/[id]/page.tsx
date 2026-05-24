import PortalBookDetailPage from "@/components/portal/BookDetailPage";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortalBookDetailPage id={id} />;
}
