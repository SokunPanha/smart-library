"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Tabs, Tag, Spin, Empty } from "antd";
import { BookOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Loan {
  id: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  fineAmount: number;
  finePaid: boolean;
  fineWaived: boolean;
  renewalCount: number;
  book: {
    id: string;
    titleEn: string;
    titleKh: string | null;
    author: string | null;
    coverImage: string | null;
  };
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "default",
};

function LoanCard({ loan }: { loan: Loan }) {
  const t = useTranslations("portal.loans");
  const isOverdue =
    loan.status === "OVERDUE" ||
    (loan.status === "ACTIVE" && dayjs(loan.dueAt).isBefore(dayjs(), "day"));
  const daysLeft = dayjs(loan.dueAt).diff(dayjs(), "day");
  const daysOverdue = dayjs().diff(dayjs(loan.dueAt), "day");

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 flex gap-3">
      <div className="w-10 h-14 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
        {loan.book.coverImage ? (
          <img src={loan.book.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOutlined className="text-slate-300 text-xs m-auto mt-4 block" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1">
          {loan.book.titleKh ?? loan.book.titleEn}
        </div>
        {loan.book.author && (
          <div className="text-xs text-slate-400 mb-1.5">{loan.book.author}</div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag color={STATUS_COLOR[loan.status]} className="text-xs m-0">
            {t(`statuses.${loan.status}`)}
          </Tag>
          {loan.status === "ACTIVE" && !isOverdue && daysLeft >= 0 && (
            <span className="text-xs text-slate-400">
              {daysLeft === 0 ? t("dueToday") : t("daysLeft", { days: daysLeft })}
            </span>
          )}
          {isOverdue && (
            <span className="text-xs text-red-500 flex items-center gap-0.5">
              <WarningOutlined className="text-xs" />
              {t("overdueDays", { days: daysOverdue })}
            </span>
          )}
          {loan.returnedAt && (
            <span className="text-xs text-slate-400">
              {t("returnedAt")}: {dayjs(loan.returnedAt).format("DD/MM/YY")}
            </span>
          )}
        </div>
        {loan.fineAmount > 0 && !loan.fineWaived && (
          <div className="mt-1 text-xs">
            {loan.finePaid
              ? <span className="text-green-600">{t("finePaid", { amount: loan.fineAmount })}</span>
              : <span className="text-red-500">{t("fineUnpaid", { amount: loan.fineAmount })}</span>
            }
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-slate-400">{t("dueAt")}</div>
        <div className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-slate-700"}`}>
          {dayjs(loan.dueAt).format("DD/MM/YY")}
        </div>
        {loan.renewalCount > 0 && (
          <div className="text-xs text-slate-400 mt-0.5">+{loan.renewalCount}</div>
        )}
      </div>
    </div>
  );
}

export default function PortalLoansPage() {
  const t = useTranslations("portal.loans");
  const [tab, setTab] = useState("active");

  const { data: activeData, isLoading: activeLoading } = useQuery<{ loans: Loan[] }>({
    queryKey: ["portal-loans", "active"],
    queryFn: () => fetch("/api/portal/loans?status=ACTIVE").then((r) => r.json()),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<{ loans: Loan[] }>({
    queryKey: ["portal-loans", "history"],
    queryFn: () => fetch("/api/portal/loans").then((r) => r.json()),
    enabled: tab === "history",
  });

  const activeLoans = activeData?.loans ?? [];
  const historyLoans = (historyData?.loans ?? []).filter(
    (l) => l.status !== "ACTIVE"
  );

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("title")}</h2>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "active",
            label: `${t("tabActive")}${activeLoans.length > 0 ? ` (${activeLoans.length})` : ""}`,
            children: activeLoading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : activeLoans.length === 0 ? (
              <Empty description={t("noActiveLoans")} className="py-8" />
            ) : (
              <div className="space-y-3">
                {activeLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
              </div>
            ),
          },
          {
            key: "history",
            label: t("tabHistory"),
            children: historyLoading ? (
              <div className="flex justify-center py-8"><Spin /></div>
            ) : historyLoans.length === 0 ? (
              <Empty description={t("noHistory")} className="py-8" />
            ) : (
              <div className="space-y-3">
                {historyLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
