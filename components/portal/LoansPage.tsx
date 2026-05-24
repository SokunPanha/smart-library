"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Spinner, Badge, Tabs, EmptyState } from "./ui";

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
  ACTIVE:   "blue",
  RETURNED: "green",
  OVERDUE:  "red",
  LOST:     "default",
};

function WarningIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  );
}

function LoanCard({ loan }: { loan: Loan }) {
  const t = useTranslations("portal.loans");
  const isOverdue =
    loan.status === "OVERDUE" ||
    (loan.status === "ACTIVE" && dayjs(loan.dueAt).isBefore(dayjs(), "day"));
  const daysLeft    = dayjs(loan.dueAt).diff(dayjs(), "day");
  const daysOverdue = dayjs().diff(dayjs(loan.dueAt), "day");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3.5 flex gap-3 shadow-sm">
      {/* Cover */}
      <div className="w-12 h-16 bg-indigo-50 dark:bg-slate-700 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
        {loan.book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={loan.book.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookIcon />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-1">
          {loan.book.titleKh ?? loan.book.titleEn}
        </p>
        {loan.book.author && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5 truncate">{loan.book.author}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge color={STATUS_COLOR[loan.status] as "blue" | "green" | "red" | "default"}>
            {t(`statuses.${loan.status}`)}
          </Badge>

          {loan.status === "ACTIVE" && !isOverdue && daysLeft >= 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {daysLeft === 0 ? t("dueToday") : t("daysLeft", { days: daysLeft })}
            </span>
          )}

          {isOverdue && (
            <span className="text-xs text-red-500 flex items-center gap-0.5">
              <WarningIcon />
              {t("overdueDays", { days: daysOverdue })}
            </span>
          )}

          {loan.returnedAt && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t("returnedAt")}: {dayjs(loan.returnedAt).format("DD/MM/YY")}
            </span>
          )}
        </div>

        {loan.fineAmount > 0 && !loan.fineWaived && (
          <p className="mt-1.5 text-xs">
            {loan.finePaid
              ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("finePaid", { amount: loan.fineAmount })}</span>
              : <span className="text-red-500 font-medium">{t("fineUnpaid", { amount: loan.fineAmount })}</span>
            }
          </p>
        )}
      </div>

      {/* Due date */}
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{t("dueAt")}</p>
        <p className={`text-xs font-semibold tabular-nums ${isOverdue ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
          {dayjs(loan.dueAt).format("DD/MM/YY")}
        </p>
        {loan.renewalCount > 0 && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">+{loan.renewalCount}×</p>
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

  const activeLoans  = activeData?.loans ?? [];
  const historyLoans = (historyData?.loans ?? []).filter((l) => l.status !== "ACTIVE");

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t("title")}</h2>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "active",
            label: `${t("tabActive")}${activeLoans.length > 0 ? ` (${activeLoans.length})` : ""}`,
            children: activeLoading
              ? <Spinner />
              : activeLoans.length === 0
              ? <EmptyState description={t("noActiveLoans")} />
              : (
                <div className="space-y-3">
                  {activeLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
                </div>
              ),
          },
          {
            key: "history",
            label: t("tabHistory"),
            children: historyLoading
              ? <Spinner />
              : historyLoans.length === 0
              ? <EmptyState description={t("noHistory")} />
              : (
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
