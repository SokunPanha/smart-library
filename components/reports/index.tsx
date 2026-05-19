"use client";

import { Tabs } from "antd";
import { FireOutlined, ExclamationCircleOutlined, BarChartOutlined, TrophyOutlined, LineChartOutlined, ClockCircleOutlined, ApartmentOutlined, ReadOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { ReportsProvider, useReportsContext } from "./helper/hooks";
import { PopularBooksTab } from "./_components/PopularBooksTab";
import { OverdueTab } from "./_components/OverdueTab";
import { CirculationTab } from "./_components/CirculationTab";
import { TopVisitorsTab } from "./_components/TopVisitorsTab";
import { VisitTrendTab } from "./_components/VisitTrendTab";
import { PeakHoursTab } from "./_components/PeakHoursTab";
import { VisitByClassTab } from "./_components/VisitByClassTab";
import { MostReadInLibraryTab } from "./_components/MostReadInLibraryTab";

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
          tabBarStyle={{ overflowX: "auto" }}
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
            {
              key: "visitors",
              label: <span className="flex items-center gap-1"><TrophyOutlined />{t("tabs.visitors")}</span>,
              children: <TopVisitorsTab />,
            },
            {
              key: "trend",
              label: <span className="flex items-center gap-1"><LineChartOutlined />{t("tabs.trend")}</span>,
              children: <VisitTrendTab />,
            },
            {
              key: "peakHours",
              label: <span className="flex items-center gap-1"><ClockCircleOutlined />{t("tabs.peakHours")}</span>,
              children: <PeakHoursTab />,
            },
            {
              key: "visitByClass",
              label: <span className="flex items-center gap-1"><ApartmentOutlined />{t("tabs.visitByClass")}</span>,
              children: <VisitByClassTab />,
            },
            {
              key: "inLibrary",
              label: <span className="flex items-center gap-1"><ReadOutlined />{t("tabs.inLibrary")}</span>,
              children: <MostReadInLibraryTab />,
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
