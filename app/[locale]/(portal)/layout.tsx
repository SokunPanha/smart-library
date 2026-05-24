import PortalNav from "@/components/portal/PortalNav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav />
      {/* top bar offset + bottom tab bar offset */}
      <main className="pt-14 pb-20">{children}</main>
    </div>
  );
}
