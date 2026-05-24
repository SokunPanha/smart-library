"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, App, Empty } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface PendingMember {
  id: string;
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  phone: string | null;
  type: string;
  createdAt: string;
}

export function PortalApprovalsTab() {
  const t = useTranslations("portal.approval");
  const tm = useTranslations("members.types");
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ members: PendingMember[]; total: number }>({
    queryKey: ["portal-pending"],
    queryFn: () =>
      fetch("/api/members?portalApproved=false&limit=100").then((r) => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      fetch(`/api/members/${id}/portal-approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      }),
    onSuccess: (_, { approved }) => {
      message.success(approved ? t("approveSuccess") : t("rejectSuccess"));
      qc.invalidateQueries({ queryKey: ["portal-pending"] });
    },
  });

  const pending = (data?.members ?? []).filter((m) => !(m as unknown as { portalApproved: boolean }).portalApproved);

  const columns = [
    {
      title: t("colName"),
      render: (_: unknown, m: PendingMember) => (
        <div>
          <div className="font-medium text-sm">{m.nameKh ?? m.nameEn}</div>
          {m.nameKh && m.nameEn && <div className="text-xs text-slate-400">{m.nameEn}</div>}
          <div className="text-xs text-slate-400 font-mono">{m.memberId}</div>
        </div>
      ),
    },
    {
      title: t("colPhone"),
      dataIndex: "phone",
      render: (v: string) => <span className="text-sm">{v ?? "—"}</span>,
    },
    {
      title: t("colType"),
      dataIndex: "type",
      render: (v: string) => <Tag>{tm(v as "STUDENT")}</Tag>,
    },
    {
      title: t("colDate"),
      dataIndex: "createdAt",
      render: (v: string) => <span className="text-sm text-slate-500">{dayjs(v).format("DD/MM/YYYY")}</span>,
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, m: PendingMember) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate({ id: m.id, approved: true })}
          >
            {t("approve")}
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate({ id: m.id, approved: false })}
          >
            {t("reject")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">{t("pending")}</h3>
        {pending.length > 0 && (
          <Tag color="orange">{pending.length}</Tag>
        )}
      </div>

      {!isLoading && pending.length === 0 ? (
        <Empty description={t("noPending")} />
      ) : (
        <Table
          dataSource={pending}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="small"
        />
      )}
    </div>
  );
}
