"use client";

import { useState } from "react";
import { Avatar, Button, Checkbox, Input, Pagination, Tag, Segmented, App, Spin, Empty } from "antd";
import {
  UserOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  CheckOutlined,
  StopOutlined as RevokeIcon,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { useDebounce, useListScroll } from "@/lib/hooks";

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
  const { message, modal } = App.useApp();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [inputVal, setInputVal] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const search = useDebounce(inputVal, 400);
  const { ref: listRef, maxHeight } = useListScroll();

  const { data, isLoading } = useQuery<MembersResponse>({
    queryKey: ["portal-approvals", filter, search, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({
        portalApproved: filter === "approved" ? "true" : "false",
        page: String(page),
        limit: String(pageSize),
      });
      if (search) params.set("search", search);
      return fetch(`/api/members?${params}`).then((r) => r.json());
    },
  });

  const members = data?.members ?? [];
  const allIds = members.map((m) => m.id);
  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const indeterminate = !allChecked && allIds.some((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  async function patchPortal(id: string, approved: boolean) {
    const res = await fetch(`/api/members/${id}/portal-approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
    return res.json();
  }

  async function patchPortalBulk(ids: string[], approved: boolean) {
    const res = await fetch("/api/members/portal-approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, approved }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
    return res.json();
  }

  // Single approve/revoke mutation
  const singleMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => patchPortal(id, approved),
    onSuccess: (_, { approved }) => {
      message.success(approved ? tp("approvedMsg") : tp("revokedMsg"));
      qc.invalidateQueries({ queryKey: ["portal-approvals"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  // Single reject (delete) mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/members/${id}`, { method: "DELETE" }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Request failed");
        return r.json();
      }),
    onSuccess: () => {
      message.success(tp("rejectMsg"));
      qc.invalidateQueries({ queryKey: ["portal-approvals"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  // Bulk approve/revoke mutation
  const bulkMutation = useMutation({
    mutationFn: ({ ids, approved }: { ids: string[]; approved: boolean }) => patchPortalBulk(ids, approved),
    onSuccess: (data, { approved }) => {
      message.success(
        approved
          ? tp("bulkApprovedMsg", { count: data.count })
          : tp("bulkRevokedMsg", { count: data.count })
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["portal-approvals"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  // Bulk reject (delete) mutation
  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(
        ids.map((id) =>
          fetch(`/api/members/${id}`, { method: "DELETE" }).then(async (r) => {
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Request failed");
          })
        )
      ),
    onSuccess: (_, ids) => {
      message.success(tp("bulkRejectedMsg", { count: ids.length }));
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["portal-approvals"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: Error) => message.error(err.message),
  });

  function confirmSingleRevoke(id: string, name: string) {
    modal.confirm({
      title: tp("revokeTitle"),
      content: tp("revokeContent", { name }),
      okText: tp("revoke"),
      okButtonProps: { danger: true },
      onOk: () => singleMutation.mutateAsync({ id, approved: false }),
    });
  }

  function confirmSingleReject(id: string, name: string) {
    modal.confirm({
      title: tp("rejectTitle"),
      content: tp("rejectContent", { name }),
      okText: tp("reject"),
      okButtonProps: { danger: true },
      onOk: () => rejectMutation.mutateAsync(id),
    });
  }

  function confirmBulk(approved: boolean) {
    const ids = [...selected];
    const count = ids.length;
    modal.confirm({
      title: approved ? tp("bulkApproveTitle") : tp("bulkRevokeTitle"),
      content: approved
        ? tp("bulkApproveContent", { count })
        : tp("bulkRevokeContent", { count }),
      okText: approved ? tp("approve") : tp("revoke"),
      okButtonProps: { danger: !approved },
      cancelText: t("common") ? undefined : "Cancel",
      onOk: () => bulkMutation.mutateAsync({ ids, approved }),
    });
  }

  function confirmBulkReject() {
    const ids = [...selected];
    const count = ids.length;
    modal.confirm({
      title: tp("bulkRejectTitle"),
      content: tp("bulkRejectContent", { count }),
      okText: tp("bulkReject"),
      okButtonProps: { danger: true },
      onOk: () => bulkRejectMutation.mutateAsync(ids),
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Segmented
          value={filter}
          onChange={(v) => { setFilter(v as "pending" | "approved"); setSelected(new Set()); setPage(1); }}
          options={[
            { label: tp("pending"), value: "pending" },
            { label: tp("approved"), value: "approved" },
          ]}
        />
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setPage(1); setSelected(new Set()); }}
          allowClear
          className="max-w-xs"
        />
      </div>

      {/* Bulk action bar — shown when items are selected */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
          <span className="text-sm text-blue-700 font-medium flex-1">
            {selected.size} {tp("selected")}
          </span>
          {filter === "pending" ? (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={bulkMutation.isPending}
                onClick={() => confirmBulk(true)}
              >
                {tp("bulkApprove")}
              </Button>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                loading={bulkRejectMutation.isPending}
                onClick={() => confirmBulkReject()}
              >
                {tp("bulkReject")}
              </Button>
            </>
          ) : (
            <Button
              danger
              size="small"
              icon={<RevokeIcon />}
              loading={bulkMutation.isPending}
              onClick={() => confirmBulk(false)}
            >
              {tp("bulkRevoke")}
            </Button>
          )}
          <Button size="small" onClick={() => setSelected(new Set())}>
            {tp("clearSelection")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : members.length === 0 ? (
        <Empty
          description={filter === "pending" ? tp("noPending") : tp("noApproved")}
          className="py-12"
        />
      ) : (
        <div ref={listRef} className="bg-white border border-slate-100 rounded-lg overflow-hidden flex flex-col" style={{ maxHeight }}>
          {/* Select-all header — always visible */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
            <Checkbox
              checked={allChecked}
              indeterminate={indeterminate}
              onChange={toggleAll}
            />
            <span className="text-xs text-slate-500 font-medium">
              {allChecked ? tp("deselectAll") : tp("selectAll")}
              {indeterminate && ` (${selected.size}/${members.length})`}
            </span>
          </div>

          {/* Member rows — scrollable */}
          <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
            {members.map((m) => {
              const isRowPending = singleMutation.isPending && singleMutation.variables?.id === m.id;
              const hasPassword = !!m.portalPassword;
              const isSelected = selected.has(m.id);

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleOne(m.id)}
                  />

                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <Avatar size={36} icon={<UserOutlined />} className="bg-slate-200 text-slate-500 shrink-0" />
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
                      {m.phone && <span className="text-xs text-slate-400">{m.phone}</span>}
                      <span className="text-xs text-slate-300">{dayjs(m.createdAt).format("DD/MM/YYYY")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {filter === "approved" && (
                      hasPassword
                        ? <CheckCircleOutlined className="text-green-500" title="Active" />
                        : <ClockCircleOutlined className="text-blue-400" title="Approved, no password yet" />
                    )}
                    {filter === "pending" && <StopOutlined className="text-orange-400" />}

                    {filter === "pending" ? (
                      <>
                        <Button
                          type="primary"
                          size="small"
                          loading={isRowPending}
                          onClick={() => singleMutation.mutate({ id: m.id, approved: true })}
                        >
                          {tp("approve")}
                        </Button>
                        <Button
                          danger
                          size="small"
                          loading={rejectMutation.isPending && rejectMutation.variables === m.id}
                          onClick={() => confirmSingleReject(m.id, m.nameKh ?? m.nameEn ?? m.memberId)}
                        >
                          {tp("reject")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        danger
                        size="small"
                        loading={isRowPending}
                        onClick={() => confirmSingleRevoke(m.id, m.nameKh ?? m.nameEn ?? m.memberId)}
                      >
                        {tp("revoke")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {(data?.total ?? 0) > 0 && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            showSizeChanger
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
            onChange={(newPage, newSize) => {
              setPage(newPage);
              if (newSize !== pageSize) {
                setPageSize(newSize);
                setPage(1);
              }
              setSelected(new Set());
            }}
            size="small"
          />
        </div>
      )}
    </div>
  );
}
