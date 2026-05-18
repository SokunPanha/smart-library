"use client";

import { Tabs } from "antd";
import { FireOutlined, ExclamationCircleOutlined, BarChartOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { ReportsProvider, useReportsContext } from "./helper/hooks";
import { PopularBooksTab } from "./_components/PopularBooksTab";
import { OverdueTab } from "./_components/OverdueTab";
import { CirculationTab } from "./_components/CirculationTab";

function ReportsPageInner() {
  const { activeTab, setActiveTab } = useReportsContext();
  const t = useTranslations("reports");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "popular",
              label: (
                <span className="flex items-center gap-1">
                  <FireOutlined />{t("tabs.popular")}
                </span>
              ),
              children: <PopularBooksTab />,
            },
            {
              key: "overdue",
              label: (
                <span className="flex items-center gap-1">
                  <ExclamationCircleOutlined />{t("tabs.overdue")}
                </span>
              ),
              children: <OverdueTab />,
            },
            {
              key: "circulation",
              label: (
                <span className="flex items-center gap-1">
                  <BarChartOutlined />{t("tabs.circulation")}
                </span>
              ),
              children: <CirculationTab />,
            },
          ]}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ReportsProvider>
      <ReportsPageInner />
    </ReportsProvider>
  );
}
