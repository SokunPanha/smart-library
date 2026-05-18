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


interface ColumnArgs {
  ctx: ReturnType<typeof useMembersContext>;
  actions: ReturnType<typeof useMembers>;
  t: (key: string) => string;
}

export function buildMemberColumns({ ctx, actions, t }: ColumnArgs): ColumnsType<Member> {
  return [
    {
      title: t("members.memberId"),
      dataIndex: "memberId",
      key: "memberId",
      render: (v) => <span className="font-mono text-sm text-slate-600">{v}</span>,
    },
    {
      title: t("members.colName"),
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
      title: t("members.type"),
      dataIndex: "type",
      key: "type",
      render: (v) => (
        <Tag color={TYPE_COLOR[v]} className="border-0">
          {t(`members.types.${v}`)}
        </Tag>
      ),
    },
    {
      title: t("members.phone"),
      dataIndex: "phone",
      key: "phone",
      render: (v) => v ?? <span className="text-slate-300">—</span>,
    },
    {
      title: t("members.colExpires"),
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
      title: t("members.colLoans"),
      key: "loans",
      render: (_, row) => (
        <span className="text-slate-500 text-sm">{row._count.loans}</span>
      ),
    },
    {
      title: t("common.actions"),
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
