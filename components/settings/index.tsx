"use client";

import { Tabs } from "antd";
import { SettingOutlined, TeamOutlined, BookOutlined, AppstoreOutlined, SolutionOutlined, ApartmentOutlined, HeatMapOutlined, MobileOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { SettingsProvider, useSettingsContext } from "./helper/hooks";
import { GeneralTab } from "./_components/GeneralTab";
import { LoanRulesTab } from "./_components/LoanRulesTab";
import { UsersTab } from "./_components/UsersTab";
import { CategoriesTab } from "./_components/CategoriesTab";
import { ClassesTab } from "./_components/ClassesTab";
import { ShelvesTab } from "./_components/ShelvesTab";
import { LibraryMapTab } from "./_components/LibraryMapTab";
import { PortalApprovalsTab } from "./_components/PortalApprovalsTab";

function SettingsPageInner() {
  const { activeTab, setActiveTab } = useSettingsContext();
  const { data: session } = useSession();
  const t = useTranslations("settings");
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <div className="bg-white border border-slate-100 rounded-lg p-3 sm:p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ overflowX: "auto" }}
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
            {
              key: "classes",
              label: <span className="flex items-center gap-1"><SolutionOutlined />{t("tabs.classes")}</span>,
              children: <ClassesTab />,
            },
            {
              key: "shelves",
              label: <span className="flex items-center gap-1"><ApartmentOutlined />{t("tabs.shelves")}</span>,
              children: <ShelvesTab />,
            },
            {
              key: "libraryMap",
              label: <span className="flex items-center gap-1"><HeatMapOutlined />{t("tabs.libraryMap")}</span>,
              children: <LibraryMapTab />,
            },
            {
              key: "portalApprovals",
              label: <span className="flex items-center gap-1"><MobileOutlined />{t("tabs.portalApprovals")}</span>,
              children: <PortalApprovalsTab />,
            },
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
