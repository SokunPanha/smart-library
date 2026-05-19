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

interface ClassPoint { className: string; grade: string | null; visits: number; }

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];

export function VisitByClassTab() {
  const t = useTranslations("reports");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const params = new URLSearchParams();
  if (range.from) params.set("dateFrom", range.from);
  if (range.to) params.set("dateTo", range.to);

  const { data = [], isLoading } = useQuery<ClassPoint[]>({
    queryKey: ["report-visit-by-class", range.from, range.to],
    queryFn: () => apiFetch<ClassPoint[]>(`/api/reports/visit-by-class?${params}`),
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter onChange={setRange} />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : data.length === 0 ? (
        <Empty description={t("visitByClass.empty")} />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="className" tick={{ fontSize: 12, fill: "#475569" }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v) => [v, t("visitByClass.visits")]}
            />
            <Bar dataKey="visits" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
