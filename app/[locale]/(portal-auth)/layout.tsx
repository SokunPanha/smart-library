import { ThemeProvider } from "@/components/portal/ThemeProvider";

export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-linear-to-b from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        {children}
      </div>
    </ThemeProvider>
  );
}
