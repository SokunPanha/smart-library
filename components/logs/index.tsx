"use client";

import { useState } from "react";
import { Table, Input, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";
import { useDebounce } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

interface ActivityLog {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  description: string;
  entityId: string | null;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  BOOK_CREATED: "blue",
  BOOK_UPDATED: "cyan",
  BOOK_DELETED: "red",
  MEMBER_CREATED: "green",
  MEMBER_UPDATED: "teal",
  MEMBER_DELETED: "red",
  LOAN_CHECKOUT: "purple",
  LOAN_RETURNED: "default",
  LOAN_RENEWED: "geekblue",
  LOAN_LOST: "orange",
  FINE_PAID: "gold",
  VISITOR_CHECKIN: "lime",
  VISITOR_CHECKOUT: "default",
  RESERVATION_CREATED: "volcano",
  RESERVATION_CANCELLED: "default",
  SETTINGS_UPDATED: "magenta",
};

export default function ActivityLogPage() {
  const t = useTranslations("logs");
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", page, search],
    queryFn: () => apiFetch<{ logs: ActivityLog[]; total: number }>(`/api/logs?${params}`),
  });

  const columns: ColumnsType<ActivityLog> = [
    {
      title: t("colTime"),
      key: "time",
      width: 140,
      render: (_, row) => (
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {dayjs(row.createdAt).format("DD/MM/YY HH:mm")}
        </span>
      ),
    },
    {
      title: t("colUser"),
      key: "user",
      width: 180,
      render: (_, row) => (
        <div>
          <p className="text-sm text-slate-800 leading-snug">{row.userName}</p>
          <p className="text-xs text-slate-400">{row.userEmail}</p>
        </div>
      ),
    },
    {
      title: t("colAction"),
      dataIndex: "action",
      key: "action",
      width: 160,
      render: (v: string) => (
        <Tag color={ACTION_COLOR[v] ?? "default"} className="text-xs border-0">
          {v.replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: t("colDescription"),
      dataIndex: "description",
      key: "description",
      render: (v: string) => <span className="text-sm text-slate-700">{v}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <div className="bg-white border border-slate-100 rounded-lg p-4 space-y-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setPage(1); }}
          className="max-w-sm"
          allowClear
        />

        <p className="text-xs text-slate-400">{t("total", { total: data?.total ?? 0 })}</p>

        <Table
          dataSource={data?.logs ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: true }}
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
          locale={{ emptyText: t("empty") }}
        />
      </div>
    </div>
  );
}
