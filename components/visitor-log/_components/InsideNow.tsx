"use client";

import { Table, Tag, Button, App, Avatar, Image } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";
import { PURPOSE_COLOR } from "../constants";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface VisitorLog {
  id: string;
  purpose: string;
  arrivedAt: string;
  member: { id: string; memberId: string; nameKh: string | null; nameEn: string | null; type: string; photo: string | null; class?: { name: string } | null };
  books: { book: { id: string; titleKh: string | null; titleEn: string | null } }[];
}

function elapsed(arrivedAt: string) {
  const mins = dayjs().diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function InsideNow() {
  const t = useTranslations("visitorLog");
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [pageSize, setPageSize] = useState(20);
  const { ref: tableRef, scrollY } = useTableScroll();

  const { data, isLoading } = useQuery({
    queryKey: ["visitor-log", "open"],
    queryFn: () => apiFetch<{ logs: VisitorLog[]; total: number }>("/api/visitor-log?openOnly=true&limit=100"),
    refetchInterval: 30_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/visitor-log/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkout" }) }),
    onSuccess: () => {
      message.success(t("checkoutSuccess"));
      qc.invalidateQueries({ queryKey: ["visitor-log"] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const logs = data?.logs ?? [];

  const columns: ColumnsType<VisitorLog> = [
    {
      title: t("colMember"),
      key: "member",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.member.photo ? (
            <Image
              src={row.member.photo}
              alt=""
              width={36}
              height={36}
              className="rounded-full object-cover flex-shrink-0"
              style={{ borderRadius: "50%" }}
              preview={{ mask: false }}
            />
          ) : (
            <Avatar size={36} icon={<UserOutlined />} className="bg-slate-100 text-slate-400 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium text-slate-800 text-sm leading-snug">{row.member.nameKh ?? row.member.nameEn}</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400">{row.member.memberId}</span>
              {row.member.class && (
                <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600">{row.member.class.name}</Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("purpose"),
      key: "purpose",
      width: 120,
      render: (_, row) => (
        <Tag color={PURPOSE_COLOR[row.purpose] ?? "default"} className="border-0 text-xs">
          {t(`purposes.${row.purpose}`)}
        </Tag>
      ),
    },
    {
      title: t("arrivedAt"),
      key: "arrivedAt",
      width: 100,
      render: (_, row) => (
        <span className="text-xs font-mono text-slate-500">{dayjs(row.arrivedAt).format("HH:mm")}</span>
      ),
    },
    {
      title: t("colDuration"),
      key: "elapsed",
      width: 80,
      render: (_, row) => (
        <span className="text-xs font-mono text-green-600">{elapsed(row.arrivedAt)}</span>
      ),
    },
    {
      title: t("booksRead"),
      key: "books",
      render: (_, row) => (
        <div className="space-y-0.5">
          {row.books.map(({ book }) => (
            <p key={book.id} className="text-xs text-slate-600">📖 {book.titleKh ?? book.titleEn}</p>
          ))}
          {row.books.length === 0 && <span className="text-slate-300 text-xs">—</span>}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Button
          size="small"
          danger
          icon={<LogoutOutlined />}
          loading={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate(row.id)}
        >
          {t("checkOut")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{t("insideNow", { count: logs.length })}</p>
      <div ref={tableRef}>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{
            pageSize,
            onShowSizeChange: (_, size) => setPageSize(size),
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            hideOnSinglePage: false,
          }}
          scroll={{ x: "max-content", y: scrollY }}
          locale={{ emptyText: t("insideEmpty") }}
        />
      </div>
    </div>
  );
}
