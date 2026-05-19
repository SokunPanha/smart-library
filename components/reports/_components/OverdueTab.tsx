"use client";

import { Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

type OverdueLoan = {
  id: string;
  dueAt: string;
  daysOverdue: number;
  estimatedFine: number;
  status: string;
  book: { titleEn: string; titleKh: string | null };
  member: { nameEn: string | null; nameKh: string | null; memberId: string };
};

export function OverdueTab() {
  const { ref: tableRef, scrollY } = useTableScroll();
  const t = useTranslations("reports");
  const tc = useTranslations("circulation");

  const { data = [], isLoading } = useQuery<OverdueLoan[]>({
    queryKey: ["report-overdue"],
    queryFn: () => apiFetch<OverdueLoan[]>("/api/reports/overdue"),
  });

  const columns: ColumnsType<OverdueLoan> = [
    {
      title: t("overdue.colMember"),
      key: "member",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.member.nameKh ?? r.member.nameEn ?? r.member.memberId}</div>
          {r.member.nameKh && r.member.nameEn && <div className="text-slate-400 text-xs">{r.member.nameEn}</div>}
          <div className="text-slate-400 text-xs font-mono">{r.member.memberId}</div>
        </div>
      ),
    },
    {
      title: t("overdue.colBook"),
      key: "book",
      render: (_, r) => (
        <div>
          <div>{r.book.titleKh ?? r.book.titleEn}</div>
          {r.book.titleKh && r.book.titleEn && <div className="text-slate-400 text-xs">{r.book.titleEn}</div>}
        </div>
      ),
    },
    {
      title: t("overdue.colDueDate"),
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v: string) => new Date(v).toLocaleDateString("en-GB"),
    },
    {
      title: t("overdue.colDaysOverdue"),
      dataIndex: "daysOverdue",
      key: "daysOverdue",
      align: "right",
      render: (v: number) => <Tag color="red">{v}d</Tag>,
      sorter: (a, b) => b.daysOverdue - a.daysOverdue,
    },
    {
      title: t("overdue.colEstFine"),
      dataIndex: "estimatedFine",
      key: "estimatedFine",
      align: "right",
      render: (v: number) => `${v.toLocaleString()} KHR`,
    },
    {
      title: t("overdue.colStatus"),
      dataIndex: "status",
      key: "status",
      render: (v: string) => <Tag color={v === "OVERDUE" ? "orange" : "blue"}>{tc(`statuses.${v}`)}</Tag>,
    },
  ];

  return (
    <div ref={tableRef}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: "max-content", y: scrollY }}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: t("overdue.empty") }}
      />
    </div>
  );
}
