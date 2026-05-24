"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/km";
import { Spinner, Select, EmptyState, Badge } from "./ui";
import RankingSection from "./RankingSection";

dayjs.extend(duration);

interface VisitLog {
  id: string;
  purpose: string;
  arrivedAt: string;
  leftAt: string | null;
  books: { book: { id: string; titleKh: string | null; titleEn: string | null } }[];
}

interface VisitsData {
  total: number;
  thisYear: number;
  byYear: Record<string, { count: number; byMonth: Record<string, number> }>;
  logs: VisitLog[];
}

function elapsed(arrivedAt: string, leftAt: string | null) {
  const end  = leftAt ? dayjs(leftAt) : dayjs();
  const mins = end.diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"/>
    </svg>
  );
}

function MonthlyChart({
  byMonth,
  year,
  months,
}: {
  byMonth: Record<string, number>;
  year: string;
  months: string[];
}) {
  const max          = Math.max(...Object.values(byMonth), 1);
  const currentMonth = dayjs().month() + 1;
  const currentYear  = String(dayjs().year());

  return (
    <div className="grid grid-cols-12 gap-1 items-end h-20">
      {months.map((label, i) => {
        const key            = String(i + 1).padStart(2, "0");
        const count          = byMonth[key] ?? 0;
        const isCurrentMonth = year === currentYear && i + 1 === currentMonth;
        const heightPct      = count > 0 ? Math.max((count / max) * 100, 12) : 0;

        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col justify-end" style={{ height: "60px" }}>
              {count > 0 && (
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isCurrentMonth
                      ? "bg-indigo-500 dark:bg-indigo-400"
                      : "bg-indigo-200 dark:bg-indigo-800"
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`${label}: ${count}`}
                />
              )}
            </div>
            <span
              className={`text-[9px] leading-none ${
                isCurrentMonth
                  ? "text-indigo-600 dark:text-indigo-400 font-medium"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PortalVisitsPage() {
  const t   = useTranslations("portal.visits");
  const tVL = useTranslations("visitorLog");
  const locale = useLocale();
  const MONTHS = t.raw("monthNames") as string[];

  function purposeLabel(purpose: string) {
    const map: Record<string, string> = {
      READING:    tVL("purposes.READING"),
      BORROWING:  tVL("purposes.BORROWING"),
      SCHOOLWORK: tVL("purposes.SCHOOLWORK"),
      RESEARCH:   tVL("purposes.RESEARCH"),
      OTHER:      tVL("purposes.OTHER"),
    };
    return map[purpose] ?? purpose;
  }

  const { data, isLoading } = useQuery<VisitsData>({
    queryKey: ["portal-visits"],
    queryFn: () => fetch("/api/portal/visits").then((r) => r.json()),
  });

  const years = Object.keys(data?.byYear ?? {}).sort((a, b) => Number(b) - Number(a));
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()));
  const activeYear = years.includes(selectedYear) ? selectedYear : years[0];

  const yearLogs = (data?.logs ?? []).filter(
    (l) => String(new Date(l.arrivedAt).getFullYear()) === activeYear
  );

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">

      {/* Header stats */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{t("title")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-linear-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-center shadow-lg shadow-indigo-200/40 dark:shadow-indigo-900/30">
            <div className="text-3xl font-bold text-white tabular-nums">{data?.total ?? 0}</div>
            <div className="text-xs text-indigo-100 mt-1">{t("totalVisits")}</div>
          </div>
          <div className="bg-linear-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg shadow-violet-200/40 dark:shadow-violet-900/30">
            <div className="text-3xl font-bold text-white tabular-nums">{data?.thisYear ?? 0}</div>
            <div className="text-xs text-violet-100 mt-1">{t("thisYear", { year: new Date().getFullYear() })}</div>
          </div>
        </div>
      </div>

      {/* Monthly ranking */}
      <RankingSection />

      {years.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8">
          <EmptyState description={t("noVisits")} />
        </div>
      ) : (
        <>
          {/* Year selector + monthly chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("monthlyBreakdown")}
              </span>
              <Select
                value={activeYear ?? ""}
                onChange={setSelectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-28"
              />
            </div>
            <MonthlyChart
              byMonth={data?.byYear[activeYear]?.byMonth ?? {}}
              year={activeYear ?? ""}
              months={MONTHS}
            />
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              {t("yearTotal", { count: data?.byYear[activeYear]?.count ?? 0, year: activeYear })}
            </p>
          </div>

          {/* Visit log */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t("visitLog")} — {activeYear}
              </span>
            </div>
            {yearLogs.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-sm text-slate-300 dark:text-slate-600">
                  {t("noVisitsYear", { year: activeYear })}
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
                {yearLogs.map((v) => (
                  <div key={v.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <PinIcon />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {dayjs(v.arrivedAt).locale(locale).format("DD MMM YYYY")}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <ClockIcon />
                            {dayjs(v.arrivedAt).format("HH:mm")}
                            {v.leftAt && ` – ${dayjs(v.leftAt).format("HH:mm")}`}
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            {elapsed(v.arrivedAt, v.leftAt)}
                          </p>
                        </div>
                      </div>
                      {v.purpose && (
                        <Badge color="default">{purposeLabel(v.purpose)}</Badge>
                      )}
                    </div>
                    {v.books.length > 0 && (
                      <div className="mt-1.5 ml-6 flex flex-wrap gap-1">
                        {v.books.map(({ book }) => (
                          <span key={book.id} className="text-xs text-slate-400 dark:text-slate-500">
                            📖 {book.titleKh ?? book.titleEn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
