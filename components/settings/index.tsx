"use client";

import { Tabs } from "antd";
import { SettingOutlined, TeamOutlined, BookOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { SettingsProvider, useSettingsContext } from "./helper/hooks";
import { GeneralTab } from "./_components/GeneralTab";
import { LoanRulesTab } from "./_components/LoanRulesTab";
import { UsersTab } from "./_components/UsersTab";
import { CategoriesTab } from "./_components/CategoriesTab";

function SettingsPageInner() {
  const { activeTab, setActiveTab } = useSettingsContext();
  const { data: session } = useSession();
  const t = useTranslations("settings");
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "general",
              label: <span className="flex items-center gap-1"><SettingOutlined />{t("tabs.general")}</span>,
              children: <GeneralTab />,
            },
            {
              key: "loanRules",
              label: <span className="flex items-center gap-1"><BookOutlined />{t("tabs.loanRules")}</span>,
              children: <LoanRulesTab />,
            },
            {
              key: "categories",
              label: <span className="flex items-center gap-1"><AppstoreOutlined />{t("tabs.categories")}</span>,
              children: <CategoriesTab />,
            },
            ...(isAdmin
              ? [
                  {
                    key: "users",
                    label: <span className="flex items-center gap-1"><TeamOutlined />{t("tabs.users")}</span>,
                    children: <UsersTab />,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPageInner />
    </SettingsProvider>
  );
}
