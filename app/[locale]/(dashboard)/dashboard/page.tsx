"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

interface DashboardData {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  recentLoans: {
    id: string;
    status: string;
    dueAt: string;
    book: { titleEn: string };
    member: { nameEn: string | null; memberId: string };
  }[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "volcano",
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const { data } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const stats = [
    { title: t("totalBooks"), value: data?.totalBooks ?? 0, icon: <BookOutlined />, color: "#1a56db" },
    { title: t("totalMembers"), value: data?.totalMembers ?? 0, icon: <TeamOutlined />, color: "#059669" },
    { title: t("activeLoans"), value: data?.activeLoans ?? 0, icon: <SwapOutlined />, color: "#d97706" },
    { title: t("overdueLoans"), value: data?.overdueLoans ?? 0, icon: <WarningOutlined />, color: "#dc2626" },
  ];

  const loanColumns = [
    {
      title: "Book",
      key: "book",
      render: (_: unknown, row: DashboardData["recentLoans"][0]) => row.book.titleEn,
    },
    {
      title: "Member",
      key: "member",
      render: (_: unknown, row: DashboardData["recentLoans"][0]) =>
        row.member.nameEn ?? row.member.memberId,
    },
    {
      title: "Due Date",
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s]} className="border-0">
          {s}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col key={stat.title} xs={24} sm={12} lg={6}>
            <Card variant="outlined" className="border border-slate-100">
              <Statistic
                title={
                  <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                    {stat.title}
                  </span>
                }
                value={stat.value}
                prefix={
                  <span style={{ color: stat.color, marginRight: 4 }}>
                    {stat.icon}
                  </span>
                }
                styles={{
                  content: { color: stat.color, fontSize: 28, fontWeight: 600 },
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <span className="text-sm font-semibold text-slate-700">
            {t("recentLoans")}
          </span>
        }
        variant="outlined"
        className="border border-slate-100"
      >
        <Table
          columns={loanColumns}
          dataSource={data?.recentLoans ?? []}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: "No loans yet." }}
        />
      </Card>
    </div>
  );
}
