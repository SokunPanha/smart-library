"use client";

import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const stats = [
    { title: t("totalBooks"), value: 0, icon: <BookOutlined />, color: "#1a56db" },
    { title: t("totalMembers"), value: 0, icon: <TeamOutlined />, color: "#059669" },
    { title: t("activeLoans"), value: 0, icon: <SwapOutlined />, color: "#d97706" },
    { title: t("overdueLoans"), value: 0, icon: <WarningOutlined />, color: "#dc2626" },
  ];

  const loanColumns = [
    { title: "Member", dataIndex: "member", key: "member" },
    { title: "Book", dataIndex: "book", key: "book" },
    { title: "Due Date", dataIndex: "dueAt", key: "dueAt" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "OVERDUE" ? "red" : "blue"}>{status}</Tag>
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
                styles={{ content: { color: stat.color, fontSize: 28, fontWeight: 600 } }}
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
          dataSource={[]}
          pagination={false}
          locale={{ emptyText: "No loans yet" }}
          size="small"
        />
      </Card>
    </div>
  );
}
