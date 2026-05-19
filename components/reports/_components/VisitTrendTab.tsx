"use client";

import { useState } from "react";
import { Segmented, Empty, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, AreaChart,
} from "recharts";
import { apiFetch } from "@/lib/request";
import { DateRangeFilter, type DateRange } from "./DateRangeFilter";

interface TrendPoint { date: string; visits: number; }

export function VisitTrendTab() {
  const t = useTranslations("reports");
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const params = new URLSearchParams({ groupBy });
  if (range.from) params.set("dateFrom", range.from);
  if (range.to) params.set("dateTo", range.to);

  const { data = [], isLoading } = useQuery<TrendPoint[]>({
    queryKey: ["report-visit-trend", groupBy, range.from, range.to],
    queryFn: () => apiFetch<TrendPoint[]>(`/api/reports/visit-trend?${params}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter onChange={setRange} />
        <Segmented
          size="small"
          value={groupBy}
          onChange={(v) => setGroupBy(v as "day" | "month")}
          options={[
            { label: t("trend.groupDay"), value: "day" },
            { label: t("trend.groupMonth"), value: "month" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : data.length === 0 ? (
        <Empty description={t("trend.empty")} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v) => [v, t("trend.visits")]}
            />
            <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fill="url(#visitGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
