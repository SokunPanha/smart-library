"use client";

import { Table, Input, Tag } from "antd";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useDebounce } from "@/lib/hooks";

interface ActivityLog {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  description: string;
  entityId: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_COLOR: Record<string, string> = {
  BOOK_CREATED: "green",
  BOOK_UPDATED: "blue",
  BOOK_DELETED: "red",
  MEMBER_CREATED: "green",
  MEMBER_UPDATED: "blue",
  MEMBER_DELETED: "red",
  LOAN_CHECKOUT: "purple",
  LOAN_RETURNED: "cyan",
  LOAN_LOST: "volcano",
  SETTINGS_UPDATED: "orange",
  USER_CREATED: "green",
  USER_UPDATED: "blue",
  USER_DELETED: "red",
  CATEGORY_CREATED: "green",
  CATEGORY_UPDATED: "blue",
  CATEGORY_DELETED: "red",
};

export function LogsTab() {
  const t = useTranslations("settings.logs");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { ref: tableRef, scrollY } = useTableScroll();

  const { data, isLoading } = useQuery<LogsResponse>({
    queryKey: ["activity-logs", page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return apiFetch<LogsResponse>(`/api/logs?${params}`);
    },
  });

  const columns: ColumnsType<ActivityLog> = [
    {
      title: t("colTime"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (v) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {dayjs(v).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: t("colUser"),
      key: "user",
      width: 160,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-slate-800 leading-snug">{row.userName}</p>
          <p className="text-xs text-slate-400">{row.userEmail}</p>
        </div>
      ),
    },
    {
      title: t("colAction"),
      dataIndex: "action",
      key: "action",
      width: 160,
      render: (v) => (
        <Tag color={ACTION_COLOR[v] ?? "default"} className="border-0 text-xs">
          {v.replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: t("colDescription"),
      dataIndex: "description",
      key: "description",
      render: (v) => <span className="text-sm text-slate-700">{v}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <Input.Search
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        allowClear
        className="max-w-sm"
      />
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data?.logs ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => t("total", { total }),
          }}
          locale={{ emptyText: t("empty") }}
        />
      </div>
    </div>
  );
}
