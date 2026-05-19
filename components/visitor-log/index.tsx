"use client";

import { useState } from "react";
import { Tabs } from "antd";
import { useTranslations } from "next-intl";
import { CheckInPanel } from "./_components/CheckInPanel";
import { InsideNow } from "./_components/InsideNow";
import { VisitorTable } from "./_components/VisitorTable";
import { useQueryClient } from "@tanstack/react-query";

export default function VisitorLogPage() {
  const t = useTranslations("visitorLog");
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");

  function onCheckedIn() {
    qc.invalidateQueries({ queryKey: ["visitor-log"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <CheckInPanel onCheckedIn={onCheckedIn} />

      <div className="bg-white border border-slate-100 rounded-lg p-3 sm:p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ overflowX: "auto" }}
          items={[
            {
              key: "inside",
              label: <InsideTabLabel />,
              children: <InsideNow />,
            },
            {
              key: "today",
              label: t("todayLog"),
              children: <VisitorTable todayOnly />,
            },
            {
              key: "history",
              label: t("history"),
              children: <VisitorTable />,
            },
          ]}
        />
      </div>
    </div>
  );
}

function InsideTabLabel() {
  const t = useTranslations("visitorLog");
  // count is rendered inside InsideNow, label just shows static text
  return <span>{t("insideNow", { count: "" }).replace(" ()", "")}</span>;
}
