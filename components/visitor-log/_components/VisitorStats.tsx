"use client";

import { useState } from "react";
import { Card, Col, DatePicker, Row, Segmented, Statistic, Tag } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import { apiFetch } from "@/lib/request";
import { PURPOSE_COLOR, PURPOSES } from "../constants";

const { RangePicker } = DatePicker;

type Period = "today" | "week" | "month" | "custom";

interface VisitorStatsData {
  insideNow: number;
  periodTotal: number;
  purposeBreakdown: Record<string, number>;
}

function buildRange(period: Period, custom: [Dayjs, Dayjs] | null) {
  if (period === "today") return { dateFrom: dayjs().startOf("day").toISOString(), dateTo: dayjs().endOf("day").toISOString() };
  if (period === "week")  return { dateFrom: dayjs().startOf("week").toISOString(), dateTo: dayjs().endOf("week").toISOString() };
  if (period === "month") return { dateFrom: dayjs().startOf("month").toISOString(), dateTo: dayjs().endOf("month").toISOString() };
  if (period === "custom" && custom) return { dateFrom: custom[0].startOf("day").toISOString(), dateTo: custom[1].endOf("day").toISOString() };
  return {};
}

export function VisitorStats() {
  const t = useTranslations("visitorLog");

  const [period, setPeriod] = useState<Period>("today");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const { dateFrom, dateTo } = buildRange(period, customRange);
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data } = useQuery({
    queryKey: ["visitor-log", "stats", period, dateFrom, dateTo],
    queryFn: () => apiFetch<VisitorStatsData>(`/api/visitor-log/stats?${params}`),
    refetchInterval: 30_000,
    enabled: period !== "custom" || !!customRange,
  });

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          size="small"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { label: t("stats.today"), value: "today" },
            { label: t("stats.week"),  value: "week"  },
            { label: t("stats.month"), value: "month" },
            { label: t("stats.custom"), value: "custom" },
          ]}
        />
        {period === "custom" && (
          <RangePicker
            size="small"
            value={customRange}
            onChange={(dates) =>
              setCustomRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)
            }
          />
        )}
      </div>

      {/* Stat cards */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  {t("stats.insideNow")}
                </span>
              }
              value={data?.insideNow ?? 0}
              prefix={<span style={{ color: "#7c3aed", marginRight: 4 }}><TeamOutlined /></span>}
              styles={{ content: { color: "#7c3aed", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  {t("stats.periodTotal")}
                </span>
              }
              value={data?.periodTotal ?? 0}
              prefix={<span style={{ color: "#0891b2", marginRight: 4 }}><UserOutlined /></span>}
              styles={{ content: { color: "#0891b2", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card variant="outlined" className="border border-slate-100 h-full">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
              {t("stats.byPurpose")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => {
                const count = data?.purposeBreakdown?.[p] ?? 0;
                return (
                  <div key={p} className="flex items-center gap-1">
                    <Tag color={PURPOSE_COLOR[p]} className="border-0 text-xs m-0">
                      {t(`purposes.${p}`)}
                    </Tag>
                    <span className="text-sm font-semibold text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
