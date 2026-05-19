"use client";

import { useState } from "react";
import { Table, Select, Tag, DatePicker, Segmented, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import { exportExcel } from "@/lib/excel";
import type { ColumnsType } from "antd/es/table";
import type { FilterMode } from "./DateRangeFilter";

const { RangePicker } = DatePicker;

interface TopVisitor {
  rank: number;
  visits: number;
  avgMinutes: number | null;
  member: {
    id: string;
    memberId: string;
    nameKh: string | null;
    nameEn: string | null;
    type: string;
    class?: { name: string } | null;
  } | undefined;
}

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue", TEACHER: "green", PUBLIC: "default", RESEARCHER: "purple",
};

function fmtDuration(mins: number | null) {
  if (mins === null) return "—";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function toRange(mode: FilterMode, date: Dayjs | null, customRange: [Dayjs, Dayjs] | null): [string, string] | null {
  if (mode === "all") return null;
  if (mode === "year" && date) {
    return [date.startOf("year").toISOString(), date.endOf("year").toISOString()];
  }
  if (mode === "month" && date) {
    return [date.startOf("month").toISOString(), date.endOf("month").toISOString()];
  }
  if (mode === "week" && date) {
    return [date.startOf("week").toISOString(), date.endOf("week").toISOString()];
  }
  if (mode === "custom" && customRange) {
    return [customRange[0].startOf("day").toISOString(), customRange[1].endOf("day").toISOString()];
  }
  return null;
}

export function TopVisitorsTab() {
  const t = useTranslations("reports");
  const tm = useTranslations("members");
  const { ref: tableRef, scrollY } = useTableScroll();

  const [limit, setLimit] = useState(10);
  const [mode, setMode] = useState<FilterMode>("all");
  const [pickerDate, setPickerDate] = useState<Dayjs | null>(dayjs());
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const range = toRange(mode, pickerDate, customRange);
  const params = new URLSearchParams({ limit: String(limit) });
  if (range) {
    params.set("dateFrom", range[0]);
    params.set("dateTo", range[1]);
  }

  const { data = [], isLoading } = useQuery<TopVisitor[]>({
    queryKey: ["report-top-visitors", limit, mode, pickerDate?.toISOString(), customRange?.[0]?.toISOString(), customRange?.[1]?.toISOString()],
    queryFn: () => apiFetch<TopVisitor[]>(`/api/reports/top-visitors?${params}`),
  });

  const columns: ColumnsType<TopVisitor> = [
    {
      title: "#",
      key: "rank",
      width: 44,
      render: (_, __, i) => (
        <span className={`font-bold text-sm ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"}`}>
          {i + 1}
        </span>
      ),
    },
    {
      title: t("visitors.colMember"),
      key: "member",
      render: (_, r) =>
        r.member ? (
          <div>
            <p className="font-medium text-slate-800 leading-snug">{r.member.nameKh ?? r.member.nameEn}</p>
            {r.member.nameKh && r.member.nameEn && (
              <p className="text-xs text-slate-400">{r.member.nameEn}</p>
            )}
            <div className="flex gap-1 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400 font-mono">{r.member.memberId}</span>
              {r.member.class && (
                <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600">{r.member.class.name}</Tag>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("visitors.colType"),
      key: "type",
      render: (_, r) =>
        r.member ? (
          <Tag color={TYPE_COLOR[r.member.type] ?? "default"} className="border-0">
            {tm(`types.${r.member.type}`)}
          </Tag>
        ) : null,
    },
    {
      title: t("visitors.colVisits"),
      dataIndex: "visits",
      key: "visits",
      align: "right",
      sorter: (a, b) => b.visits - a.visits,
      render: (v) => <span className="font-semibold text-blue-600">{v}</span>,
    },
    {
      title: t("visitors.colAvgDuration"),
      key: "avgMinutes",
      align: "right",
      render: (_, r) => <span className="text-slate-500 text-sm">{fmtDuration(r.avgMinutes)}</span>,
    },
  ];

  function handleExport() {
    exportExcel(
      data.map((r, i) => ({
        [t("visitors.colMember")]: r.member?.nameKh ?? r.member?.nameEn ?? "",
        "Member ID": r.member?.memberId ?? "",
        [t("visitors.colType")]: r.member?.type ?? "",
        [t("visitors.colVisits")]: r.visits,
        [t("visitors.colAvgDuration")]: fmtDuration(r.avgMinutes),
      })),
      "Top Visitors",
      "top-visitors"
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Top N */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">{t("popular.showTop")}</span>
          <Select
            value={limit}
            onChange={setLimit}
            size="small"
            options={[
              { label: t("popular.top10"), value: 10 },
              { label: t("popular.top20"), value: 20 },
              { label: t("popular.top50"), value: 50 },
            ]}
          />
        </div>

        {/* Period mode */}
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => setMode(v as FilterMode)}
          options={[
            { label: t("visitors.periodAll"), value: "all" },
            { label: t("visitors.periodYear"), value: "year" },
            { label: t("visitors.periodMonth"), value: "month" },
            { label: t("visitors.periodWeek"), value: "week" },
            { label: t("visitors.periodCustom"), value: "custom" },
          ]}
        />

        {/* Contextual date picker */}
        {mode === "year" && (
          <DatePicker
            picker="year"
            size="small"
            value={pickerDate}
            onChange={(d) => setPickerDate(d)}
            allowClear={false}
          />
        )}
        {mode === "month" && (
          <DatePicker
            picker="month"
            size="small"
            value={pickerDate}
            onChange={(d) => setPickerDate(d)}
            allowClear={false}
          />
        )}
        {mode === "week" && (
          <DatePicker
            picker="week"
            size="small"
            value={pickerDate}
            onChange={(d) => setPickerDate(d)}
            allowClear={false}
          />
        )}
        {mode === "custom" && (
          <RangePicker
            size="small"
            value={customRange}
            onChange={(dates) =>
              setCustomRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)
            }
          />
        )}
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
          rowKey={(r) => r.member?.id ?? String(r.rank)}
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={false}
          locale={{ emptyText: t("visitors.empty") }}
        />
      </div>
    </div>
  );
}
