"use client";

import { Table, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import { exportExcel } from "@/lib/excel";
import type { ColumnsType } from "antd/es/table";

type CirculationRow = {
  month: string;
  checkouts: number;
  returns: number;
  overdue: number;
};

export function CirculationTab() {
  const [months, setMonths] = useState(6);
  const { ref: tableRef, scrollY } = useTableScroll();
  const t = useTranslations("reports");
  const tc = useTranslations("common");

  const { data = [], isLoading } = useQuery<CirculationRow[]>({
    queryKey: ["report-circulation", months],
    queryFn: () => apiFetch<CirculationRow[]>(`/api/reports/circulation?months=${months}`),
  });

  const columns: ColumnsType<CirculationRow> = [
    {
      title: t("circulation.colMonth"),
      dataIndex: "month",
      key: "month",
      render: (v: string) => {
        const [year, month] = v.split("-");
        return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });
      },
    },
    { title: t("circulation.colCheckouts"), dataIndex: "checkouts", key: "checkouts", align: "right" },
    { title: t("circulation.colReturns"), dataIndex: "returns", key: "returns", align: "right" },
    { title: t("circulation.colOverdue"), dataIndex: "overdue", key: "overdue", align: "right" },
    {
      title: t("circulation.colReturnRate"),
      key: "rate",
      align: "right",
      render: (_, r) =>
        r.checkouts > 0 ? `${Math.round((r.returns / r.checkouts) * 100)}%` : "—",
    },
  ];

  function handleExport() {
    exportExcel(
      data.map((r) => {
        const [year, month] = r.month.split("-");
        const label = new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });
        const rate = r.checkouts > 0 ? `${Math.round((r.returns / r.checkouts) * 100)}%` : "—";
        return {
          [t("circulation.colMonth")]: label,
          [t("circulation.colCheckouts")]: r.checkouts,
          [t("circulation.colReturns")]: r.returns,
          [t("circulation.colOverdue")]: r.overdue,
          [t("circulation.colReturnRate")]: rate,
        };
      }),
      "Circulation",
      "circulation"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-600 text-sm">{t("circulation.period")}</span>
        <Select
          value={months}
          onChange={setMonths}
          size="small"
          options={[
            { label: t("circulation.last3months"), value: 3 },
            { label: t("circulation.last6months"), value: 6 },
            { label: t("circulation.last12months"), value: 12 },
          ]}
        />
        <div className="ml-auto">
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} disabled={!data.length}>
            {t("exportExcel")}
          </Button>
        </div>
      </div>
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="month"
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={false}
          locale={{ emptyText: t("circulation.empty") }}
          summary={(rows) => {
            const total = rows.reduce(
              (acc, r) => ({ checkouts: acc.checkouts + r.checkouts, returns: acc.returns + r.returns, overdue: acc.overdue + r.overdue }),
              { checkouts: 0, returns: 0, overdue: 0 }
            );
            return (
              <Table.Summary.Row className="font-semibold bg-slate-50">
                <Table.Summary.Cell index={0}>{t("circulation.total")}</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{total.checkouts}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">{total.returns}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{total.overdue}</Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {total.checkouts > 0 ? `${Math.round((total.returns / total.checkouts) * 100)}%` : "—"}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
