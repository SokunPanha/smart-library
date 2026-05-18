"use client";

import { ConfigProvider, App } from "antd";
import { useLocale } from "next-intl";
import enUS from "antd/locale/en_US";
import kmKH from "@/locales/antd/km_KH";
import { minimalTheme } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import SessionProvider from "./SessionProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={locale === "km" ? kmKH : enUS}
          theme={minimalTheme}
        >
          <App>{children}</App>
        </ConfigProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
