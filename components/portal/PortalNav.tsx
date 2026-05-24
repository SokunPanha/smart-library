"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Button, Dropdown } from "antd";
import {
  HomeOutlined,
  BookOutlined,
  UnorderedListOutlined,
  IdcardOutlined,
  GlobalOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const NAV_ITEMS = [
  { key: "dashboard", icon: HomeOutlined, labelKey: "home" },
  { key: "books", icon: BookOutlined, labelKey: "books" },
  { key: "loans", icon: UnorderedListOutlined, labelKey: "loans" },
  { key: "visits", icon: EnvironmentOutlined, labelKey: "visits" },
  { key: "card", icon: IdcardOutlined, labelKey: "card" },
] as const;

export default function PortalNav() {
  const t = useTranslations("portal.nav");
  const tp = useTranslations("portal");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMember = (session?.user as any)?.userType === "MEMBER";

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const langItems: MenuProps["items"] = [
    { key: "km", label: "ខ្មែរ", onClick: () => switchLocale("km") },
    { key: "en", label: "English", onClick: () => switchLocale("en") },
  ];

  const currentKey = pathname.split("/")[2] || "dashboard";

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img src="/LibraCore.png" alt="LibraCore" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-slate-800 text-sm">LibraCore</span>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown menu={{ items: langItems }} placement="bottomRight">
            <Button type="text" icon={<GlobalOutlined />} size="small" className="text-slate-500">
              {locale === "km" ? "ខ្មែរ" : "EN"}
            </Button>
          </Dropdown>
          {isMember && (
            <Button
              type="text"
              icon={<LogoutOutlined />}
              size="small"
              className="text-slate-500"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            >
              {tp("signOut")}
            </Button>
          )}
        </div>
      </header>

      {/* Bottom tab bar — only for authenticated members */}
      {isMember && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 flex print:hidden">
          {NAV_ITEMS.map(({ key, icon: Icon, labelKey }) => {
            const active = currentKey === key || (key === "dashboard" && currentKey === "");
            return (
              <button
                key={key}
                onClick={() => router.push(`/${locale}/${key}`)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                  active ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <Icon className={`text-lg ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span>{t(labelKey)}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
