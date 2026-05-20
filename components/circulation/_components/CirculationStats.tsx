"use client";

import { useState } from "react";
import { Card, Col, DatePicker, Row, Segmented, Statistic } from "antd";
import { SwapOutlined, WarningOutlined, StopOutlined, DollarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs, { Dayjs } from "dayjs";
import { apiFetch } from "@/lib/request";

const { RangePicker } = DatePicker;

type Period = "week" | "month" | "custom";

interface StatsData {
  active: number;
  overdue: number;
  lost: number;
  unpaidFinesCount: number;
  unpaidFinesTotal: number;
  paidFinesCount: number;
  paidFinesTotal: number;
}

function buildRange(period: Period, custom: [Dayjs, Dayjs] | null) {
  if (period === "week")  return { dateFrom: dayjs().startOf("week").toISOString(),  dateTo: dayjs().endOf("week").toISOString() };
  if (period === "month") return { dateFrom: dayjs().startOf("month").toISOString(), dateTo: dayjs().endOf("month").toISOString() };
  if (period === "custom" && custom) return { dateFrom: custom[0].startOf("day").toISOString(), dateTo: custom[1].endOf("day").toISOString() };
  return {};
}

export function CirculationStats() {
  const t = useTranslations("circulation.stats");

  const [period, setPeriod] = useState<Period>("month");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const { dateFrom, dateTo } = buildRange(period, customRange);
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data } = useQuery({
    queryKey: ["loans", "stats", period, dateFrom, dateTo],
    queryFn: () => apiFetch<StatsData>(`/api/loans/stats?${params}`),
    refetchInterval: 60_000,
    enabled: period !== "custom" || !!customRange,
  });

  return (
    <div className="space-y-3">
      {/* Period filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          size="small"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { label: t("week"),   value: "week"   },
            { label: t("month"),  value: "month"  },
            { label: t("custom"), value: "custom" },
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

      {/* All cards in one row */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={<span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{t("active")}</span>}
              value={data?.active ?? 0}
              prefix={<span style={{ color: "#1a56db", marginRight: 4 }}><SwapOutlined /></span>}
              styles={{ content: { color: "#1a56db", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={<span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{t("overdue")}</span>}
              value={data?.overdue ?? 0}
              prefix={<span style={{ color: "#dc2626", marginRight: 4 }}><WarningOutlined /></span>}
              styles={{ content: { color: "#dc2626", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={<span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{t("lost")}</span>}
              value={data?.lost ?? 0}
              prefix={<span style={{ color: "#ea580c", marginRight: 4 }}><StopOutlined /></span>}
              styles={{ content: { color: "#ea580c", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={<span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{t("unpaidFines")}</span>}
              value={data?.unpaidFinesCount ?? 0}
              suffix={
                data?.unpaidFinesTotal ? (
                  <span className="text-sm font-normal text-slate-500"> · {data.unpaidFinesTotal.toLocaleString()} ៛</span>
                ) : undefined
              }
              prefix={<span style={{ color: "#d97706", marginRight: 4 }}><DollarOutlined /></span>}
              styles={{ content: { color: "#d97706", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Card variant="outlined" className="border border-slate-100">
            <Statistic
              title={<span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{t("paidFines")}</span>}
              value={data?.paidFinesTotal ?? 0}
              suffix={<span className="text-sm font-normal text-slate-500"> ៛</span>}
              prefix={<span style={{ color: "#059669", marginRight: 4 }}><CheckCircleOutlined /></span>}
              styles={{ content: { color: "#059669", fontSize: 24, fontWeight: 600 } }}
              formatter={(v) => Number(v).toLocaleString()}
            />
            {(data?.paidFinesCount ?? 0) > 0 && (
              <p className="text-xs text-slate-400 mt-1">{t("transactions", { count: data!.paidFinesCount })}</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
