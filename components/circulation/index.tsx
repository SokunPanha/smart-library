"use client";

import { useState } from "react";
import { Table, Button, Select, Input, Space, App } from "antd";
import { PlusOutlined, QrcodeOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useDebounce, useTableScroll } from "@/lib/hooks";
import { CirculationProvider, useCirculationContext } from "./helper/hooks";
import { useFetchLoans } from "./helper/useFetchLoans";
import { useLoans } from "./helper/useLoans";
import { buildLoanColumns } from "./_components/Columns";
import CheckoutModal from "./CheckoutModal";
import { QRScanModal } from "./_components/QRScanModal";
import { apiFetch } from "@/libs/utils/request";
import type { Loan } from "./helper/useFetchLoans";


function CirculationPageInner() {
  const ctx = useCirculationContext();
  const actions = useLoans();
  const { modal, message } = App.useApp();
  const [statusFilter, setStatusFilter] = ctx.statusFilter;
  const [scanOpen, setScanOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);
  const t = useTranslations();

  async function handleScanCheckout(bookId: string, memberId: string, dueAt?: string) {
    await apiFetch("/api/loans", {
      method: "POST",
      body: JSON.stringify({ bookId, memberId, dueAt }),
    });
    message.success(t("circulation.checkoutSuccess"));
    ctx.table.reload();
  }

  async function handleScanReturn(loanId: string) {
    const updated = await apiFetch<{ fineAmount: number }>(`/api/loans/${loanId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "RETURNED", finePaid: false }),
    });
    if (updated.fineAmount > 0) {
      message.warning(t("circulation.returnedWithFine", { amount: updated.fineAmount.toLocaleString() }));
    } else {
      message.success(t("circulation.returnSuccess"));
    }
    ctx.table.reload();
  }

  const STATUS_OPTIONS = [
    { label: t("circulation.statuses.ACTIVE"), value: "ACTIVE" },
    { label: t("circulation.statuses.OVERDUE"), value: "OVERDUE" },
    { label: t("circulation.statuses.RETURNED"), value: "RETURNED" },
    { label: t("circulation.statuses.LOST"), value: "LOST" },
  ];
  const { data, isLoading } = useFetchLoans(statusFilter, search, ctx.table.page);
  const { ref: tableRef, scrollY } = useTableScroll();

  const confirmReturn = (loan: Loan, asLost = false) => {
    modal.confirm({
      title: asLost ? t("circulation.lostTitle") : t("circulation.returnTitle"),
      content: asLost
        ? t("circulation.lostContent", { title: loan.book.titleEn })
        : t("circulation.returnContent", { title: loan.book.titleEn, name: loan.member.nameEn ?? loan.member.memberId }),
      okText: t("common.confirm"),
      cancelText: t("common.cancel"),
      onOk: () => actions.closeLoan(loan, asLost ? "LOST" : "RETURNED"),
    });
  };

  const columns = buildLoanColumns({
    actions,
    onReturn: (loan) => confirmReturn(loan),
    onLost: (loan) => confirmReturn(loan, true),
    t,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800">{t("circulation.title")}</h1>
        <Space wrap>
          <Button icon={<QrcodeOutlined />} onClick={() => setScanOpen(true)}>
            <span className="hidden sm:inline">{t("circulation.scanQr")}</span>
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.checkoutModal.open()}>
            <span className="hidden sm:inline">{t("circulation.checkout")}</span>
          </Button>
        </Space>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap mb-4">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder={t("circulation.searchPlaceholder")}
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
            className="max-w-sm"
            allowClear
          />
          <Select
            placeholder={t("circulation.filterPlaceholder")}
            value={statusFilter || undefined}
            onChange={(v) => {
              setStatusFilter(v ?? "");
              ctx.table.setPage(1);
            }}
            allowClear
            className="w-44"
            options={STATUS_OPTIONS}
          />
        </div>

        <div ref={tableRef}>
          <Table
            columns={columns}
            dataSource={data?.loans ?? []}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ x: "max-content", y: scrollY }}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            rowClassName={(row) => (row.status === "OVERDUE" ? "bg-red-50" : "")}
            locale={{ emptyText: t("circulation.noLoans") }}
          />
        </div>
      </div>

      <CheckoutModal
        open={ctx.checkoutModal.isOpen}
        onClose={ctx.checkoutModal.close}
        onSuccess={() => {
          ctx.checkoutModal.close();
          ctx.table.reload();
        }}
      />

      <QRScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onCheckout={handleScanCheckout}
        onReturn={handleScanReturn}
      />
    </div>
  );
}

export default function CirculationPage() {
  return (
    <CirculationProvider>
      <CirculationPageInner />
    </CirculationProvider>
  );
}
