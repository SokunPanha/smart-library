"use client";

import { Button, Space, Tag, Tooltip } from "antd";
import { CheckOutlined, StopOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Loan } from "../helper/useFetchLoans";
import type { useLoans } from "../helper/useLoans";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "volcano",
};

interface ColumnArgs {
  actions: ReturnType<typeof useLoans>;
  onReturn: (loan: Loan) => void;
  onLost: (loan: Loan) => void;
  t: (key: string) => string;
}

export function buildLoanColumns({ onReturn, onLost, t }: ColumnArgs): ColumnsType<Loan> {
  return [
    {
      title: t("circulation.colBook"),
      key: "book",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">{row.book.titleEn}</p>
          {row.book.titleKh && <p className="text-xs text-slate-400">{row.book.titleKh}</p>}
        </div>
      ),
    },
    {
      title: t("circulation.colMember"),
      key: "member",
      render: (_, row) => (
        <div>
          <p className="text-slate-700">{row.member.nameEn ?? row.member.nameKh ?? "—"}</p>
          <p className="text-xs font-mono text-slate-400">{row.member.memberId}</p>
        </div>
      ),
    },
    {
      title: t("circulation.colBorrowed"),
      dataIndex: "borrowedAt",
      key: "borrowedAt",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: t("circulation.colDue"),
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v, row) => {
        const overdue = row.status === "ACTIVE" && dayjs(v).isBefore(dayjs());
        return (
          <span className={overdue ? "text-red-500 font-medium" : "text-slate-600"}>
            {dayjs(v).format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={STATUS_COLOR[v]} className="border-0">
          {t(`circulation.statuses.${v}`)}
        </Tag>
      ),
    },
    {
      title: t("circulation.colFine"),
      key: "fine",
      render: (_, row) =>
        row.fineAmount > 0 ? (
          <span className={row.finePaid ? "text-slate-400 line-through" : "text-red-500 font-medium"}>
            {row.fineAmount.toLocaleString()} ៛
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 100,
      render: (_, row) =>
        row.status === "ACTIVE" || row.status === "OVERDUE" ? (
          <Space size="small">
            <Tooltip title={t("circulation.returnTooltip")}>
              <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => onReturn(row)} />
            </Tooltip>
            <Tooltip title={t("circulation.lostTooltip")}>
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => onLost(row)} />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];
}
