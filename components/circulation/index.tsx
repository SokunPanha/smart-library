"use client";

import { Table, Button, Select, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CirculationProvider, useCirculationContext } from "./helper/hooks";
import { useFetchLoans } from "./helper/useFetchLoans";
import { useLoans } from "./helper/useLoans";
import { buildLoanColumns } from "./_components/Columns";
import CheckoutModal from "./components/CheckoutModal";
import type { Loan } from "./helper/useFetchLoans";

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Returned", value: "RETURNED" },
  { label: "Lost", value: "LOST" },
];

function CirculationPageInner() {
  const ctx = useCirculationContext();
  const actions = useLoans();
  const { modal } = App.useApp();
  const [statusFilter, setStatusFilter] = ctx.statusFilter;

  const { data, isLoading } = useFetchLoans(statusFilter, ctx.table.page);

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
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Circulation</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.checkoutModal.open()}>
          Check Out
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Select
          placeholder="Filter by status"
          value={statusFilter || undefined}
          onChange={(v) => {
            setStatusFilter(v ?? "");
            ctx.table.setPage(1);
          }}
          allowClear
          className="w-48 mb-4"
          options={STATUS_OPTIONS}
        />

        <Table
          columns={columns}
          dataSource={data?.loans ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          {...ctx.table.props}
          pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
          rowClassName={(row) => (row.status === "OVERDUE" ? "bg-red-50" : "")}
          locale={{ emptyText: "No loans found." }}
        />
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
