"use client";

import { useState } from "react";
import { Table, Tag, Input, Select, DatePicker, Button, Tooltip } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/libs/utils/request";
import type { ColumnsType } from "antd/es/table";
import { LinkBookModal } from "./LinkBookModal";

const { RangePicker } = DatePicker;

interface VisitorLog {
  id: string;
  purpose: string;
  arrivedAt: string;
  leftAt: string | null;
  note: string | null;
  recordedBy: string;
  member: { id: string; memberId: string; nameKh: string | null; nameEn: string | null; type: string; class?: { name: string } | null };
  book?: { titleKh: string | null; titleEn: string | null } | null;
}

const PURPOSE_COLOR: Record<string, string> = {
  READING: "blue", BORROWING: "green", SCHOOLWORK: "orange", RESEARCH: "purple", OTHER: "default",
};

function duration(arrivedAt: string, leftAt: string | null) {
  const end = leftAt ? dayjs(leftAt) : dayjs();
  const mins = end.diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
  todayOnly?: boolean;
}

export function VisitorTable({ todayOnly }: Props) {
  const t = useTranslations("visitorLog");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [linkingLog, setLinkingLog] = useState<VisitorLog | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (todayOnly) params.set("todayOnly", "true");
  if (search) params.set("search", search);
  if (purpose) params.set("purpose", purpose);
  if (!todayOnly && dateRange) {
    params.set("dateFrom", dateRange[0]);
    params.set("dateTo", dateRange[1]);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["visitor-log", todayOnly ? "today" : "history", page, search, purpose, dateRange],
    queryFn: () => apiFetch<{ logs: VisitorLog[]; total: number }>(`/api/visitor-log?${params}`),
    refetchInterval: todayOnly ? 30_000 : false,
  });

  const columns: ColumnsType<VisitorLog> = [
    {
      title: t("arrivedAt"),
      key: "arrivedAt",
      render: (_, row) => (
        <div>
          <p className="text-xs text-slate-700">{dayjs(row.arrivedAt).format("DD/MM/YY HH:mm")}</p>
          {row.leftAt && <p className="text-xs text-slate-400">{t("leftAt")}: {dayjs(row.leftAt).format("HH:mm")}</p>}
        </div>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, row) => (
        <span className={`text-xs font-mono ${row.leftAt ? "text-slate-500" : "text-green-600"}`}>
          {row.leftAt ? duration(row.arrivedAt, row.leftAt) : t("open")}
        </span>
      ),
    },
    {
      title: "Member",
      key: "member",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 text-sm leading-snug">{row.member.nameKh ?? row.member.nameEn}</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400">{row.member.memberId}</span>
            {row.member.class && (
              <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600">{row.member.class.name}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("purpose"),
      dataIndex: "purpose",
      key: "purpose",
      render: (v) => (
        <Tag color={PURPOSE_COLOR[v] ?? "default"} className="border-0 text-xs">
          {t(`purposes.${v}`)}
        </Tag>
      ),
    },
    {
      title: "Book / Note",
      key: "detail",
      render: (_, row) => (
        <div>
          {row.book && <p className="text-xs text-slate-600">📖 {row.book.titleKh ?? row.book.titleEn}</p>}
          {row.note && <p className="text-xs text-slate-400 italic">{row.note}</p>}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_, row) =>
        row.purpose === "READING" ? (
          <Tooltip title={row.book ? "Change book" : t("scanBook")}>
            <Button
              type="text"
              size="small"
              icon={<BookOutlined />}
              className={row.book ? "text-blue-400" : "text-slate-400"}
              onClick={() => setLinkingLog(row)}
            />
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-52"
          allowClear
        />
        <Select
          value={purpose || undefined}
          onChange={(v) => { setPurpose(v ?? ""); setPage(1); }}
          placeholder={t("filterPurpose")}
          allowClear
          className="w-40"
          options={[
            { value: "READING", label: t("purposes.READING") },
            { value: "BORROWING", label: t("purposes.BORROWING") },
            { value: "SCHOOLWORK", label: t("purposes.SCHOOLWORK") },
            { value: "RESEARCH", label: t("purposes.RESEARCH") },
            { value: "OTHER", label: t("purposes.OTHER") },
          ]}
        />
        {!todayOnly && (
          <RangePicker
            size="middle"
            onChange={(_, strs) => {
              setDateRange(strs[0] && strs[1] ? [strs[0], strs[1]] : null);
              setPage(1);
            }}
          />
        )}
      </div>

      <p className="text-xs text-slate-400">{t("total", { total: data?.total ?? 0 })}</p>

      <Table
        dataSource={data?.logs ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        scroll={{ x: true }}
        locale={{ emptyText: todayOnly ? t("todayEmpty") : t("empty") }}
      />

      {linkingLog && (
        <LinkBookModal
          logId={linkingLog.id}
          memberName={linkingLog.member.nameKh ?? linkingLog.member.nameEn ?? ""}
          currentBook={linkingLog.book}
          onClose={() => setLinkingLog(null)}
        />
      )}
    </div>
  );
}
