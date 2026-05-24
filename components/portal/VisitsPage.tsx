"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Spin, Select, Empty, Tag } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  const end = leftAt ? dayjs(leftAt) : dayjs();
  const mins = end.diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function MonthlyChart({ byMonth, year }: { byMonth: Record<string, number>; year: string }) {
  const max = Math.max(...Object.values(byMonth), 1);
  const currentMonth = dayjs().month() + 1;
  const currentYear = String(dayjs().year());

  return (
    <div className="grid grid-cols-12 gap-1 items-end h-20">
      {MONTHS.map((label, i) => {
        const key = String(i + 1).padStart(2, "0");
        const count = byMonth[key] ?? 0;
        const isCurrentMonth = year === currentYear && i + 1 === currentMonth;
        const heightPct = count > 0 ? Math.max((count / max) * 100, 12) : 0;

        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col justify-end" style={{ height: "60px" }}>
              {count > 0 && (
                <div
                  className={`w-full rounded-t-sm transition-all ${isCurrentMonth ? "bg-blue-500" : "bg-blue-200"}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${label}: ${count}`}
                />
              )}
            </div>
            <span className={`text-[9px] leading-none ${isCurrentMonth ? "text-blue-600 font-medium" : "text-slate-300"}`}>
              {label.charAt(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PortalVisitsPage() {
  const t = useTranslations("portal.visits");
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

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spin /></div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header stats */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("title")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{data?.total ?? 0}</div>
            <div className="text-xs text-blue-500 mt-1">{t("totalVisits")}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-slate-700">{data?.thisYear ?? 0}</div>
            <div className="text-xs text-slate-400 mt-1">{t("thisYear", { year: new Date().getFullYear() })}</div>
          </div>
        </div>
      </div>

      {years.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8">
          <Empty description={t("noVisits")} />
        </div>
      ) : (
        <>
          {/* Year selector + monthly chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">{t("monthlyBreakdown")}</span>
              <Select
                size="small"
                value={activeYear}
                onChange={setSelectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-24"
              />
            </div>
            <MonthlyChart
              byMonth={data?.byYear[activeYear]?.byMonth ?? {}}
              year={activeYear}
            />
            <div className="mt-2 text-center text-xs text-slate-400">
              {t("yearTotal", { count: data?.byYear[activeYear]?.count ?? 0, year: activeYear })}
            </div>
          </div>

          {/* Visit log for selected year */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50">
              <span className="text-sm font-medium text-slate-700">{t("visitLog")} — {activeYear}</span>
            </div>
            {yearLogs.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-sm text-slate-300">{t("noVisitsYear", { year: activeYear })}</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {yearLogs.map((v) => (
                  <div key={v.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <EnvironmentOutlined className="text-blue-400 text-sm mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-slate-800">
                            {dayjs(v.arrivedAt).format("DD MMM YYYY")}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <ClockCircleOutlined className="text-xs" />
                            {dayjs(v.arrivedAt).format("HH:mm")}
                            {v.leftAt && ` – ${dayjs(v.leftAt).format("HH:mm")}`}
                            <span className="text-slate-300">·</span>
                            {elapsed(v.arrivedAt, v.leftAt)}
                          </div>
                        </div>
                      </div>
                      {v.purpose && (
                        <Tag className="text-xs border-0 bg-slate-50 text-slate-500 flex-shrink-0">
                          {v.purpose}
                        </Tag>
                      )}
                    </div>
                    {v.books.length > 0 && (
                      <div className="mt-1.5 ml-5 flex flex-wrap gap-1">
                        {v.books.map(({ book }) => (
                          <span key={book.id} className="text-xs text-slate-400">
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
