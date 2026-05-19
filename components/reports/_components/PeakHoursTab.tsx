"use client";

import { useState } from "react";
import { Empty, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import { apiFetch } from "@/libs/utils/request";
import { DateRangeFilter, type DateRange } from "./DateRangeFilter";

interface HourPoint { hour: number; visits: number; }

function fmtHour(h: number) {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

export function PeakHoursTab() {
  const t = useTranslations("reports");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const params = new URLSearchParams();
  if (range.from) params.set("dateFrom", range.from);
  if (range.to) params.set("dateTo", range.to);

  const { data = [], isLoading } = useQuery<HourPoint[]>({
    queryKey: ["report-peak-hours", range.from, range.to],
    queryFn: () => apiFetch<HourPoint[]>(`/api/reports/peak-hours?${params}`),
  });

  const maxVisits = Math.max(...data.map((d) => d.visits), 1);

  return (
    <div className="space-y-4">
      <DateRangeFilter onChange={setRange} />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : data.every((d) => d.visits === 0) ? (
        <Empty description={t("peakHours.empty")} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={fmtHour} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                labelFormatter={(h) => fmtHour(Number(h))}
                formatter={(v) => [v, t("peakHours.visits")]}
              />
              <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={entry.visits === maxVisits ? "#3b82f6" : entry.visits > maxVisits * 0.6 ? "#93c5fd" : "#dbeafe"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400">
            {t("peakHours.peak")}: <span className="font-medium text-slate-600">{fmtHour(data.reduce((a, b) => a.visits > b.visits ? a : b).hour)}</span>
          </p>
        </>
      )}
    </div>
  );
}
