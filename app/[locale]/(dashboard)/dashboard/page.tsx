"use client";

import { useState, useRef } from "react";
import { Avatar, Card, Col, DatePicker, Row, Segmented, Statistic, Table, Tag } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  WarningOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

type Period = "all" | "year" | "sixMonth" | "month" | "week" | "custom";

interface Loan {
  id: string;
  status: string;
  dueAt: string;
  borrowedAt: string;
  book: { titleEn: string | null; titleKh: string | null };
  member: { nameEn: string | null; nameKh: string | null; memberId: string };
}

interface DashboardData {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  visitorsInside: number;
  visitorsTodayTotal: number;
  recentLoans: Loan[];
  dueSoon: Loan[];
  recentMembers: {
    id: string;
    memberId: string;
    nameEn: string | null;
    nameKh: string | null;
    type: string;
    photo: string | null;
    createdAt: string;
  }[];
  popularBooks: {
    id?: string;
    titleEn: string | null;
    titleKh: string | null;
    loanCount: number;
  }[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "volcano",
};

const MEMBER_TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue",
  TEACHER: "green",
  PUBLIC: "default",
  RESEARCHER: "purple",
};

function computeDateRange(period: Period, customRange: [Dayjs, Dayjs] | null): { dateFrom?: string; dateTo?: string } {
  const now = dayjs();
  if (period === "all") return {};
  if (period === "year") return { dateFrom: now.startOf("year").toISOString(), dateTo: now.endOf("year").toISOString() };
  if (period === "sixMonth") return { dateFrom: now.subtract(6, "month").startOf("day").toISOString(), dateTo: now.endOf("day").toISOString() };
  if (period === "month") return { dateFrom: now.startOf("month").toISOString(), dateTo: now.endOf("month").toISOString() };
  if (period === "week") return { dateFrom: now.startOf("week").toISOString(), dateTo: now.endOf("week").toISOString() };
  if (period === "custom" && customRange) return { dateFrom: customRange[0].startOf("day").toISOString(), dateTo: customRange[1].endOf("day").toISOString() };
  return {};
}

export default function DashboardPage() {
  const t = useTranslations();

  const [period, setPeriod] = useState<Period>("all");
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

  const { dateFrom, dateTo } = computeDateRange(period, customRange);
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const { data } = useQuery<DashboardData>({
    queryKey: ["dashboard", period, dateFrom, dateTo],
    queryFn: () => fetch(`/api/dashboard?${params}`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const stats = [
    { title: t("dashboard.totalBooks"), value: data?.totalBooks ?? 0, icon: <BookOutlined />, color: "#1a56db" },
    { title: t("dashboard.totalMembers"), value: data?.totalMembers ?? 0, icon: <TeamOutlined />, color: "#059669" },
    { title: t("dashboard.activeLoans"), value: data?.activeLoans ?? 0, icon: <SwapOutlined />, color: "#d97706" },
    { title: t("dashboard.overdueLoans"), value: data?.overdueLoans ?? 0, icon: <WarningOutlined />, color: "#dc2626" },
    { title: t("dashboard.visitorsInside"), value: data?.visitorsInside ?? 0, icon: <EyeOutlined />, color: "#7c3aed" },
    { title: t("dashboard.visitorsToday"), value: data?.visitorsTodayTotal ?? 0, icon: <UserOutlined />, color: "#0891b2" },
  ];

  const loanColumns = [
    {
      title: t("circulation.colBook"),
      key: "book",
      render: (_: unknown, row: Loan) => (
        <span className="text-sm text-slate-700">{row.book.titleKh ?? row.book.titleEn}</span>
      ),
    },
    {
      title: t("circulation.colMember"),
      key: "member",
      render: (_: unknown, row: Loan) => (
        <span className="text-sm text-slate-600">{row.member.nameKh ?? row.member.nameEn ?? row.member.memberId}</span>
      ),
    },
    {
      title: t("circulation.colDue"),
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v: string) => (
        <span className={`text-xs ${dayjs(v).isBefore(dayjs()) ? "text-red-500 font-medium" : "text-slate-500"}`}>
          {dayjs(v).format("DD/MM/YY")}
        </span>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s]} className="border-0 text-xs">
          {t(`circulation.statuses.${s}`)}
        </Tag>
      ),
    },
  ];

  const dueSoonColumns = [
    {
      title: t("circulation.colBook"),
      key: "book",
      render: (_: unknown, row: Loan) => (
        <span className="text-sm text-slate-700">{row.book.titleKh ?? row.book.titleEn}</span>
      ),
    },
    {
      title: t("circulation.colMember"),
      key: "member",
      render: (_: unknown, row: Loan) => (
        <span className="text-sm text-slate-600">{row.member.nameKh ?? row.member.nameEn ?? row.member.memberId}</span>
      ),
    },
    {
      title: t("circulation.colDue"),
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v: string, row: Loan) => {
        const daysLeft = dayjs(v).diff(dayjs(), "day");
        const isOverdue = row.status === "OVERDUE";
        return (
          <div>
            <p className={`text-xs font-medium ${isOverdue ? "text-red-500" : daysLeft <= 2 ? "text-orange-500" : "text-slate-600"}`}>
              {isOverdue ? t("dashboard.overdue") : t("dashboard.daysLeft", { days: daysLeft + 1 })}
            </p>
            <p className="text-[10px] text-slate-400">{dayjs(v).format("DD/MM/YY")}</p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">{t("dashboard.title")}</h1>

      {/* Stat cards */}
      <Row gutter={[12, 12]}>
        {stats.map((stat) => (
          <Col key={stat.title} xs={12} sm={8} lg={4}>
            <Card variant="outlined" className="border border-slate-100">
              <Statistic
                title={
                  <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                    {stat.title}
                  </span>
                }
                value={stat.value}
                prefix={<span style={{ color: stat.color, marginRight: 4 }}>{stat.icon}</span>}
                styles={{ content: { color: stat.color, fontSize: 24, fontWeight: 600 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Period filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          size="small"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          options={[
            { label: t("dashboard.period.all"), value: "all" },
            { label: t("dashboard.period.year"), value: "year" },
            { label: t("dashboard.period.sixMonth"), value: "sixMonth" },
            { label: t("dashboard.period.month"), value: "month" },
            { label: t("dashboard.period.week"), value: "week" },
            { label: t("dashboard.period.custom"), value: "custom" },
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

      {/* Main content grid */}
      <Row gutter={[16, 16]}>
        {/* Recent Loans */}
        <Col xs={24} lg={14}>
          <Card
            title={<span className="text-sm font-semibold text-slate-700">{t("dashboard.recentLoans")}</span>}
            variant="outlined"
            className="border border-slate-100 h-full"
            styles={{ body: { padding: "0 0 8px" } }}
          >
            <Table
              columns={loanColumns}
              dataSource={data?.recentLoans ?? []}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
              locale={{ emptyText: t("common.noData") }}
            />
          </Card>
        </Col>

        {/* Popular Books */}
        <Col xs={24} lg={10}>
          <Card
            title={<span className="text-sm font-semibold text-slate-700">{t("dashboard.popularBooks")}</span>}
            variant="outlined"
            className="border border-slate-100 h-full"
          >
            {data?.popularBooks?.length ? (
              <div className="space-y-3">
                {data.popularBooks.map((book, i) => (
                  <div key={book.id ?? i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-100 text-yellow-600" :
                      i === 1 ? "bg-slate-100 text-slate-500" :
                      i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate leading-snug">
                        {book.titleKh ?? book.titleEn}
                      </p>
                      {book.titleKh && book.titleEn && (
                        <p className="text-xs text-slate-400 truncate">{book.titleEn}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {t("dashboard.loanCount", { count: book.loanCount })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300 py-4 text-center">{t("dashboard.noPopularBooks")}</p>
            )}
          </Card>
        </Col>

        {/* Due Soon */}
        <Col xs={24} lg={14}>
          <Card
            title={<span className="text-sm font-semibold text-slate-700">{t("dashboard.dueSoon")}</span>}
            variant="outlined"
            className="border border-slate-100 h-full"
            styles={{ body: { padding: "0 0 8px" } }}
          >
            <Table
              columns={dueSoonColumns}
              dataSource={data?.dueSoon ?? []}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
              locale={{ emptyText: t("dashboard.noDueSoon") }}
            />
          </Card>
        </Col>

        {/* Recent Members */}
        <Col xs={24} lg={10}>
          <Card
            title={<span className="text-sm font-semibold text-slate-700">{t("dashboard.recentMembers")}</span>}
            variant="outlined"
            className="border border-slate-100 h-full"
          >
            {data?.recentMembers?.length ? (
              <div className="divide-y divide-slate-100">
                {data.recentMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2">
                    <Avatar
                      size={36}
                      src={m.photo ?? undefined}
                      icon={!m.photo && <UserOutlined />}
                      className="flex-shrink-0 bg-slate-100 text-slate-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                        {m.nameKh ?? m.nameEn ?? m.memberId}
                      </p>
                      <p className="text-xs text-slate-400">{m.memberId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Tag color={MEMBER_TYPE_COLOR[m.type]} className="border-0 text-xs m-0">
                        {t(`members.types.${m.type}`)}
                      </Tag>
                      <span className="text-[10px] text-slate-400">
                        {dayjs(m.createdAt).format("DD/MM/YY")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-300 py-4 text-center">{t("dashboard.noRecentMembers")}</p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
