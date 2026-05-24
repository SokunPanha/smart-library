"use client";

import { useState } from "react";
import { Avatar, Button, Input, Tag, Segmented, App, Spin, Empty } from "antd";
import {
  UserOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { useDebounce } from "@/lib/hooks";

interface PortalMember {
  id: string;
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  type: string;
  photo: string | null;
  phone: string | null;
  portalApproved: boolean;
  portalPassword: string | null;
  createdAt: string;
  class: { name: string } | null;
}

interface MembersResponse {
  members: PortalMember[];
  total: number;
}

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue",
  TEACHER: "green",
  PUBLIC: "default",
  RESEARCHER: "purple",
};

export function PortalApprovalsTab() {
  const t = useTranslations("members");
  const tp = useTranslations("members.portal");
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const { data, isLoading } = useQuery<MembersResponse>({
    queryKey: ["portal-approvals", filter, search],
    queryFn: () => {
      const params = new URLSearchParams({
        portalApproved: filter === "approved" ? "true" : "false",
        limit: "100",
      });
      if (search) params.set("search", search);
      return fetch(`/api/members?${params}`).then((r) => r.json());
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      fetch(`/api/members/${id}/portal-approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      }),
    onSuccess: (_, { approved }) => {
      message.success(approved ? tp("approvedMsg") : tp("revokedMsg"));
      qc.invalidateQueries({ queryKey: ["portal-approvals"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const members = data?.members ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as "pending" | "approved")}
          options={[
            { label: tp("pending"), value: "pending" },
            { label: tp("approved"), value: "approved" },
          ]}
        />
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("searchPlaceholder")}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          allowClear
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : members.length === 0 ? (
        <Empty
          description={filter === "pending" ? tp("noPending") : tp("noApproved")}
          className="py-12"
        />
      ) : (
        <div className="bg-white border border-slate-100 rounded-lg divide-y divide-slate-50">
          {members.map((m) => {
            const isPending = approveMutation.isPending && approveMutation.variables?.id === m.id;
            const hasPassword = !!m.portalPassword;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                {m.photo ? (
                  <img src={m.photo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <Avatar size={36} icon={<UserOutlined />} className="bg-slate-200 text-slate-500 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {m.nameKh ?? m.nameEn}
                    </span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                      {m.memberId}
                    </span>
                    <Tag color={TYPE_COLOR[m.type] ?? "default"} className="border-0 text-xs m-0">
                      {t(`types.${m.type as "STUDENT"}`)}
                    </Tag>
                    {m.class && (
                      <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600 m-0">{m.class.name}</Tag>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.phone && (
                      <span className="text-xs text-slate-400">{m.phone}</span>
                    )}
                    <span className="text-xs text-slate-300">
                      {dayjs(m.createdAt).format("DD/MM/YYYY")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status indicator */}
                  {filter === "approved" && (
                    hasPassword ? (
                      <CheckCircleOutlined className="text-green-500" title="Active" />
                    ) : (
                      <ClockCircleOutlined className="text-blue-400" title="Approved, no password yet" />
                    )
                  )}
                  {filter === "pending" && (
                    <StopOutlined className="text-orange-400" />
                  )}

                  {filter === "pending" ? (
                    <Button
                      type="primary"
                      size="small"
                      loading={isPending}
                      onClick={() => approveMutation.mutate({ id: m.id, approved: true })}
                    >
                      {tp("approve")}
                    </Button>
                  ) : (
                    <Button
                      danger
                      size="small"
                      loading={isPending}
                      onClick={() => approveMutation.mutate({ id: m.id, approved: false })}
                    >
                      {tp("revoke")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
