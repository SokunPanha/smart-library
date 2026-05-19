"use client";

import { useState } from "react";
import { Table, Button, Select, Input, Tag, Modal, Form, App, Tooltip, Badge } from "antd";
import { PlusOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";
import { useDebounce, useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

interface Reservation {
  id: string;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  reservedAt: string;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdBy: string | null;
  book: { id: string; titleEn: string; titleKh: string | null; coverImage: string | null; availableCopies: number };
  member: { id: string; nameEn: string | null; nameKh: string | null; memberId: string };
}

interface BookOption {
  id: string;
  titleEn: string;
  titleKh: string | null;
  availableCopies: number;
}

interface MemberOption {
  id: string;
  nameEn: string | null;
  nameKh: string | null;
  memberId: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "orange",
  FULFILLED: "green",
  CANCELLED: "default",
};

export function ReservationsTab() {
  const t = useTranslations("circulation");
  const tc = useTranslations("common");
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const { ref: tableRef, scrollY } = useTableScroll();

  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [inputVal, setInputVal] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(inputVal, 400);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (statusFilter) params.set("status", statusFilter);
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", statusFilter, search, page],
    queryFn: () => apiFetch<{ reservations: Reservation[]; total: number }>(`/api/reservations?${params}`),
  });

  const { data: booksData } = useQuery({
    queryKey: ["books-select", bookSearch],
    queryFn: () => apiFetch<{ books: BookOption[] }>(`/api/books?search=${encodeURIComponent(bookSearch)}&limit=20`).then((d) => d.books),
    enabled: addOpen,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members-select", memberSearch],
    queryFn: () => apiFetch<{ members: MemberOption[] }>(`/api/members?search=${encodeURIComponent(memberSearch)}&limit=20`).then((d) => d.members),
    enabled: addOpen,
  });

  function reload() {
    qc.invalidateQueries({ queryKey: ["reservations"] });
  }

  async function handleCancel(r: Reservation) {
    modal.confirm({
      title: t("reservation.cancelTitle"),
      content: t("reservation.cancelContent", { title: r.book.titleKh ?? r.book.titleEn }),
      okText: tc("confirm"),
      cancelText: tc("cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await apiFetch(`/api/reservations/${r.id}`, { method: "PATCH" });
        message.success(t("reservation.cancelSuccess"));
        reload();
      },
    });
  }

  async function handleAdd(values: { bookId: string; memberId: string }) {
    setAddLoading(true);
    try {
      await apiFetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify(values),
      });
      message.success(t("reservation.createSuccess"));
      addForm.resetFields();
      setAddOpen(false);
      reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "ALREADY_RESERVED") message.error(t("reservation.alreadyReserved"));
      else if (msg === "ALREADY_ON_LOAN") message.error(t("reservation.alreadyOnLoan"));
      else message.error(t("reservation.createError"));
    } finally {
      setAddLoading(false);
    }
  }

  const columns: ColumnsType<Reservation> = [
    {
      title: t("colBook"),
      key: "book",
      render: (_, row) => (
        <div className="flex gap-2 items-start">
          {row.book.coverImage ? (
            <img src={row.book.coverImage} alt="cover" className="w-8 h-11 object-cover rounded flex-shrink-0" />
          ) : (
            <div className="w-8 h-11 bg-slate-100 rounded flex-shrink-0" />
          )}
          <div>
            <p className="font-medium text-slate-800 leading-snug">{row.book.titleKh ?? row.book.titleEn}</p>
            {row.book.titleKh && row.book.titleEn && <p className="text-xs text-slate-400">{row.book.titleEn}</p>}
          </div>
        </div>
      ),
    },
    {
      title: t("colMember"),
      key: "member",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">{row.member.nameKh ?? row.member.nameEn ?? "—"}</p>
          <p className="text-xs font-mono text-slate-400">{row.member.memberId}</p>
        </div>
      ),
    },
    {
      title: t("reservation.colReservedAt"),
      key: "reservedAt",
      render: (_, row) => <span className="text-slate-600 text-sm">{dayjs(row.reservedAt).format("DD/MM/YYYY HH:mm")}</span>,
    },
    {
      title: tc("status"),
      key: "status",
      render: (_, row) => (
        <div>
          <Tag color={STATUS_COLOR[row.status]} className="border-0">
            {t(`reservation.statuses.${row.status}`)}
          </Tag>
          {row.status === "FULFILLED" && row.fulfilledAt && (
            <p className="text-[10px] text-slate-400 mt-0.5">{dayjs(row.fulfilledAt).format("DD/MM/YY HH:mm")}</p>
          )}
        </div>
      ),
    },
    {
      title: tc("actions"),
      key: "actions",
      width: 80,
      render: (_, row) =>
        row.status !== "CANCELLED" ? (
          <Tooltip title={t("reservation.cancelTooltip")}>
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleCancel(row)}
            />
          </Tooltip>
        ) : null,
    },
  ];

  const pendingCount = statusFilter !== "PENDING" ? undefined : data?.total;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setPage(1); }}
          className="max-w-sm"
          allowClear
        />
        <Select
          value={statusFilter || undefined}
          placeholder={t("filterPlaceholder")}
          onChange={(v) => { setStatusFilter(v ?? ""); setPage(1); }}
          allowClear
          className="w-44"
          options={[
            { label: t("reservation.statuses.PENDING"), value: "PENDING" },
            { label: t("reservation.statuses.FULFILLED"), value: "FULFILLED" },
            { label: t("reservation.statuses.CANCELLED"), value: "CANCELLED" },
          ]}
        />
        <div className="ml-auto">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            {t("reservation.add")}
          </Button>
        </div>
      </div>

      {/* Fulfilled alert banner */}
      {data?.reservations.some((r) => r.status === "FULFILLED") && statusFilter !== "CANCELLED" && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
          <span className="font-medium">{t("reservation.fulfilledBanner")}</span>
        </div>
      )}

      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data?.reservations ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
          rowClassName={(row) => row.status === "FULFILLED" ? "bg-green-50" : ""}
          locale={{ emptyText: t("reservation.empty") }}
        />
      </div>

      {/* Add Reservation Modal */}
      <Modal
        title={t("reservation.addTitle")}
        open={addOpen}
        onCancel={() => { addForm.resetFields(); setAddOpen(false); }}
        footer={null}
        width={440}
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd} className="mt-4">
          <Form.Item label={t("bookLabel")} name="bookId" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t("bookSearchPlaceholder")}
              filterOption={false}
              onSearch={setBookSearch}
              options={(booksData ?? []).map((b) => ({
                label: (
                  <div>
                    <span>{b.titleKh ?? b.titleEn}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({b.availableCopies} {t("available")})
                    </span>
                  </div>
                ),
                value: b.id,
              }))}
              notFoundContent={t("noBooks")}
            />
          </Form.Item>
          <Form.Item label={t("memberLabel")} name="memberId" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t("memberSearchPlaceholder")}
              filterOption={false}
              onSearch={setMemberSearch}
              options={(membersData ?? []).map((m) => ({
                label: (
                  <div>
                    <span>{m.nameKh ?? m.nameEn ?? m.memberId}</span>
                    <span className="text-xs font-mono text-slate-400 ml-2">{m.memberId}</span>
                  </div>
                ),
                value: m.id,
              }))}
              notFoundContent={t("noMembers")}
            />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => { addForm.resetFields(); setAddOpen(false); }}>{tc("cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={addLoading}>{t("reservation.add")}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
