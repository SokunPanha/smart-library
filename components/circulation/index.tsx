"use client";

import { Table, Button, Select, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useTableScroll } from "@/lib/hooks";
import { CirculationProvider, useCirculationContext } from "./helper/hooks";
import { useFetchLoans } from "./helper/useFetchLoans";
import { useLoans } from "./helper/useLoans";
import { buildLoanColumns } from "./_components/Columns";
import CheckoutModal from "./components/CheckoutModal";
import type { Loan } from "./helper/useFetchLoans";


function CirculationPageInner() {
  const ctx = useCirculationContext();
  const actions = useLoans();
  const { modal } = App.useApp();
  const [statusFilter, setStatusFilter] = ctx.statusFilter;

  const t = useTranslations();
  const STATUS_OPTIONS = [
    { label: t("circulation.statuses.ACTIVE"), value: "ACTIVE" },
    { label: t("circulation.statuses.OVERDUE"), value: "OVERDUE" },
    { label: t("circulation.statuses.RETURNED"), value: "RETURNED" },
    { label: t("circulation.statuses.LOST"), value: "LOST" },
  ];
  const { data, isLoading } = useFetchLoans(statusFilter, ctx.table.page);
  const { ref: tableRef, scrollY } = useTableScroll();

  const confirmReturn = (loan: Loan, asLost = false) => {
    modal.confirm({
      title: asLost ? "Mark as Lost?" : "Return Book?",
      content: asLost
        ? `Mark "${loan.book.titleEn}" as lost?`
        : `Return "${loan.book.titleEn}" borrowed by ${loan.member.nameEn ?? loan.member.memberId}?`,
      okText: "Confirm",
      cancelText: "Cancel",
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{t("circulation.title")}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.checkoutModal.open()}>
          {t("circulation.checkout")}
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Select
          placeholder={t("circulation.filterPlaceholder")}
          value={statusFilter || undefined}
          onChange={(v) => {
            setStatusFilter(v ?? "");
            ctx.table.setPage(1);
          }}
          allowClear
          className="w-48 mb-4"
          options={STATUS_OPTIONS}
        />

        <div ref={tableRef}>
          <Table
            columns={columns}
            dataSource={data?.loans ?? []}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ y: scrollY }}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            rowClassName={(row) => (row.status === "OVERDUE" ? "bg-red-50" : "")}
            locale={{ emptyText: "No loans found." }}
          />
        </div>
      </div>

      <CheckoutModal
        {...ctx.checkoutModal.props}
        onSuccess={() => {
          ctx.checkoutModal.close();
          ctx.table.reload();
        }}
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
