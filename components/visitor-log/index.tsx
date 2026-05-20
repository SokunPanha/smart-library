"use client";

import { useState } from "react";
import { Button, Tabs } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { CheckInPanel } from "./_components/CheckInPanel";
import { BulkCheckInModal } from "./_components/BulkCheckInModal";
import { InsideNow } from "./_components/InsideNow";
import { VisitorTable } from "./_components/VisitorTable";
import { VisitorStats } from "./_components/VisitorStats";
import { useQueryClient } from "@tanstack/react-query";

export default function VisitorLogPage() {
  const t = useTranslations("visitorLog");
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  function onCheckedIn() {
    qc.invalidateQueries({ queryKey: ["visitor-log"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>
        <div className="flex gap-2">
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => setBulkOpen(true)}
          >
            {t("bulk.button")}
          </Button>
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={() => setCheckInOpen(true)}
          >
            {t("scanMember")}
          </Button>
        </div>
      </div>

      <VisitorStats />

      <CheckInPanel
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onCheckedIn={onCheckedIn}
      />
      <BulkCheckInModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onCheckedIn={onCheckedIn}
      />

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
  return <span>{t("insideNowTab")}</span>;
}
