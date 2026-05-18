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
}

export function buildLoanColumns({ onReturn, onLost }: ColumnArgs): ColumnsType<Loan> {
  return [
    {
      title: "Book",
      key: "book",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">{row.book.titleEn}</p>
          {row.book.titleKh && <p className="text-xs text-slate-400">{row.book.titleKh}</p>}
        </div>
      ),
    },
    {
      title: "Member",
      key: "member",
      render: (_, row) => (
        <div>
          <p className="text-slate-700">{row.member.nameEn ?? row.member.nameKh ?? "—"}</p>
          <p className="text-xs font-mono text-slate-400">{row.member.memberId}</p>
        </div>
      ),
    },
    {
      title: "Borrowed",
      dataIndex: "borrowedAt",
      key: "borrowedAt",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Due Date",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={STATUS_COLOR[v]} className="border-0">
          {v}
        </Tag>
      ),
    },
    {
      title: "Fine",
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
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, row) =>
        row.status === "ACTIVE" || row.status === "OVERDUE" ? (
          <Space size="small">
            <Tooltip title="Return Book">
              <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => onReturn(row)} />
            </Tooltip>
            <Tooltip title="Mark as Lost">
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => onLost(row)} />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];
}
