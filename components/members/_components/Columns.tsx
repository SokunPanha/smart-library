"use client";

import { Avatar, Button, Image, Space, Tag, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, QrcodeOutlined, UserOutlined } from "@ant-design/icons";
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
        <div className="flex items-center gap-2.5">
          {row.photo ? (
            <Image
              src={row.photo}
              alt="profile"
              width={36}
              height={36}
              className="rounded-full object-cover flex-shrink-0"
              style={{ borderRadius: "50%" }}
              preview={{ mask: false }}
            />
          ) : (
            <Avatar
              size={36}
              icon={<UserOutlined />}
              className="flex-shrink-0 bg-slate-100 text-slate-400"
            />
          )}
          <div>
            <p className="font-medium text-slate-800 leading-snug">
              {row.nameKh ?? row.nameEn ?? <span className="text-slate-300">—</span>}
            </p>
            {row.nameKh && row.nameEn && <p className="text-xs text-slate-400">{row.nameEn}</p>}
          </div>
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
      title: t("members.class"),
      key: "class",
      render: (_, row) =>
        row.class ? (
          <Tag className="border-0 bg-indigo-50 text-indigo-600 font-medium">{row.class.name}</Tag>
        ) : (
          <span className="text-slate-300">—</span>
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
      title: t("common.createdBy"),
      key: "createdBy",
      render: (_, row) => (
        <div className="min-w-[110px]">
          <p className="text-xs text-slate-700 leading-snug">{row.createdBy ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{dayjs(row.createdAt).format("DD/MM/YY HH:mm")}</p>
          {row.updatedBy && row.updatedBy !== row.createdBy && (
            <>
              <p className="text-xs text-slate-500 leading-snug mt-1">{row.updatedBy}</p>
              <p className="text-[10px] text-slate-400">{dayjs(row.updatedAt).format("DD/MM/YY HH:mm")}</p>
            </>
          )}
        </div>
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
                photo: row.photo ?? undefined,
                nameEn: row.nameEn ?? undefined,
                nameKh: row.nameKh ?? undefined,
                expiresAt: row.expiresAt ? dayjs(row.expiresAt) : undefined,
                classId: row.classId ?? undefined,
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
