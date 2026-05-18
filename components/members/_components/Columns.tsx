"use client";

import { Button, Space, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Member } from "../helper/useFetchMembers";
import type { useMembers } from "../helper/useMembers";
import type { useMembersContext } from "../helper/hooks";

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue",
  TEACHER: "green",
  PUBLIC: "default",
  RESEARCHER: "purple",
};

const TYPE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  PUBLIC: "Public",
  RESEARCHER: "Researcher",
};

interface ColumnArgs {
  ctx: ReturnType<typeof useMembersContext>;
  actions: ReturnType<typeof useMembers>;
}

export function buildMemberColumns({ ctx, actions }: ColumnArgs): ColumnsType<Member> {
  return [
    {
      title: "Member ID",
      dataIndex: "memberId",
      key: "memberId",
      render: (v) => <span className="font-mono text-sm text-slate-600">{v}</span>,
    },
    {
      title: "Name",
      key: "name",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">
            {row.nameEn ?? <span className="text-slate-300">—</span>}
          </p>
          {row.nameKh && <p className="text-xs text-slate-400">{row.nameKh}</p>}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (v) => (
        <Tag color={TYPE_COLOR[v]} className="border-0">
          {TYPE_LABEL[v]}
        </Tag>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (v) => v ?? <span className="text-slate-300">—</span>,
    },
    {
      title: "Expires",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (v) => {
        if (!v) return <span className="text-slate-300">—</span>;
        const expired = dayjs(v).isBefore(dayjs());
        return (
          <span className={expired ? "text-red-500 font-medium" : "text-slate-600"}>
            {dayjs(v).format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Loans",
      key: "loans",
      render: (_, row) => (
        <span className="text-slate-500 text-sm">{row._count.loans}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              ctx.editForm.open({
                ...row,
                email: row.email ?? undefined,
                phone: row.phone ?? undefined,
                nameEn: row.nameEn ?? undefined,
                nameKh: row.nameKh ?? undefined,
                expiresAt: row.expiresAt ?? undefined,
              })
            }
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => actions.deleteMember(row)}
          />
        </Space>
      ),
    },
  ];
}
