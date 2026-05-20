"use client";

import { useState, useEffect } from "react";
import { Table, Button, Select, Input, Space, App, Tabs, Badge } from "antd";
import { PlusOutlined, QrcodeOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useDebounce, useTableScroll } from "@/lib/hooks";
import { CirculationProvider, useCirculationContext } from "./helper/hooks";
import { useFetchLoans } from "./helper/useFetchLoans";
import { useLoans } from "./helper/useLoans";
import { buildLoanColumns } from "./_components/Columns";
import { MarkAsLostModal } from "./_components/MarkAsLostModal";
import { ReservationsTab } from "./_components/ReservationsTab";
import CheckoutModal from "./CheckoutModal";
import { QRScanModal } from "./_components/QRScanModal";
import { apiFetch } from "@/lib/request";
import { useFetchSettings } from "@/components/settings/helper/useFetchSettings";
import type { Loan } from "./helper/useFetchLoans";


function CirculationPageInner() {
  const ctx = useCirculationContext();
  const actions = useLoans();
  const { modal, message } = App.useApp();
  const [statusFilter, setStatusFilter] = ctx.statusFilter;
  const [scanOpen, setScanOpen] = useState(false);
  const [lostLoan, setLostLoan] = useState<Loan | null>(null);
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
    { label: t("circulation.filterUnpaidFines"), value: "UNPAID_FINE" },
  ];
  const { data, isLoading } = useFetchLoans(statusFilter, search, ctx.table.page);
  const { data: settings } = useFetchSettings();
  const maxRenewals = Number(settings?.maxRenewalsPerLoan ?? 2);
  const { ref: tableRef, scrollY } = useTableScroll();
  useEffect(() => {
    apiFetch<{ marked: number }>("/api/loans/mark-overdue", { method: "POST" })
      .then(({ marked }) => { if (marked > 0) ctx.table.reload(); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: reservationMeta } = useQuery({
    queryKey: ["reservations", "FULFILLED", "", 1],
    queryFn: () => apiFetch<{ total: number }>("/api/reservations?status=FULFILLED&limit=1"),
  });
  const fulfilledCount = reservationMeta?.total ?? 0;

  const confirmReturn = (loan: Loan) => {
    modal.confirm({
      title: t("circulation.returnTitle"),
      content: t("circulation.returnContent", { title: loan.book.titleKh ?? loan.book.titleEn, name: loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId }),
      okText: t("common.confirm"),
      cancelText: t("common.cancel"),
      onOk: () => actions.closeLoan(loan, "RETURNED"),
    });
  };

  const confirmRenew = (loan: Loan) => {
    modal.confirm({
      title: t("circulation.renewTitle"),
      content: t("circulation.renewContent", { title: loan.book.titleKh ?? loan.book.titleEn }),
      okText: t("common.confirm"),
      cancelText: t("common.cancel"),
      onOk: () => actions.renewLoan(loan),
    });
  };

  const confirmPayFine = (loan: Loan) => {
    modal.confirm({
      title: t("circulation.payFineTitle"),
      content: t("circulation.payFineContent", {
        amount: loan.fineAmount.toLocaleString(),
        name: loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId,
      }),
      okText: t("circulation.payFineConfirm"),
      cancelText: t("common.cancel"),
      onOk: () => actions.payFine(loan),
    });
  };

  const confirmWaiveFine = (loan: Loan) => {
    modal.confirm({
      title: t("circulation.waiveFineTitle"),
      content: t("circulation.waiveFineContent", {
        amount: loan.fineAmount.toLocaleString(),
        name: loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId,
      }),
      okText: t("circulation.waiveFineConfirm"),
      cancelText: t("common.cancel"),
      onOk: () => actions.waiveFine(loan, ""),
    });
  };

  const columns = buildLoanColumns({
    actions,
    onReturn: (loan) => confirmReturn(loan),
    onLost: (loan) => setLostLoan(loan),
    onRenew: confirmRenew,
    onPayFine: confirmPayFine,
    onWaiveFine: confirmWaiveFine,
    maxRenewals,
    t,
  });

  const loansTab = (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
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
          rowClassName={(row) =>
            row.status === "OVERDUE"
              ? "bg-red-50"
              : row.fineAmount > 0 && !row.finePaid && (row.status === "RETURNED" || row.status === "LOST")
              ? "bg-amber-50"
              : ""
          }
          locale={{ emptyText: t("circulation.noLoans") }}
        />
      </div>
    </div>
  );

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
        <Tabs
          defaultActiveKey="loans"
          items={[
            {
              key: "loans",
              label: t("circulation.tabLoans"),
              children: loansTab,
            },
            {
              key: "reservations",
              label: (
                <Badge count={fulfilledCount} size="small" offset={[6, -2]}>
                  {t("circulation.tabReservations")}
                </Badge>
              ),
              children: <ReservationsTab />,
            },
          ]}
        />
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

      <MarkAsLostModal
        loan={lostLoan}
        onConfirm={async (loan, fineAmount, fineNote) => { await actions.markAsLost(loan, fineAmount, fineNote); }}
        onClose={() => setLostLoan(null)}
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
