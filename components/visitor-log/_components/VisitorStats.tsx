"use client";

import { Card, Col, Row, Statistic, Tag } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { PURPOSE_COLOR, PURPOSES } from "../constants";

interface VisitorStatsData {
  insideNow: number;
  todayTotal: number;
  purposeBreakdown: Record<string, number>;
}

export function VisitorStats() {
  const t = useTranslations("visitorLog");

  const { data } = useQuery({
    queryKey: ["visitor-log", "stats"],
    queryFn: () => apiFetch<VisitorStatsData>("/api/visitor-log/stats"),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-3">
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
                  {t("stats.todayTotal")}
                </span>
              }
              value={data?.todayTotal ?? 0}
              prefix={<span style={{ color: "#0891b2", marginRight: 4 }}><UserOutlined /></span>}
              styles={{ content: { color: "#0891b2", fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card variant="outlined" className="border border-slate-100 h-full">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
              {t("stats.todayByPurpose")}
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
