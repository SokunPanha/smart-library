"use client";

import { Button, Space, Tag, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, QrcodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
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
  onQR: (member: Member) => void;
}

export function buildMemberColumns({ ctx, actions, t, onQR }: ColumnArgs): ColumnsType<Member> {
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
            {row.nameKh ?? row.nameEn ?? <span className="text-slate-300">—</span>}
          </p>
          {row.nameKh && row.nameEn && <p className="text-xs text-slate-400">{row.nameEn}</p>}
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
          <Tooltip title={t("members.qrCode")}>
            <Button
              type="text"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => onQR(row)}
            />
          </Tooltip>
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
                expiresAt: row.expiresAt ? dayjs(row.expiresAt) : undefined,
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
