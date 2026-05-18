"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

const { Sider } = Layout;

export default function AppSidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const items = [
    { key: "dashboard", icon: <DashboardOutlined />, label: t("dashboard") },
    { key: "catalog", icon: <BookOutlined />, label: t("catalog") },
    { key: "members", icon: <TeamOutlined />, label: t("members") },
    { key: "circulation", icon: <SwapOutlined />, label: t("circulation") },
    { key: "reports", icon: <BarChartOutlined />, label: t("reports") },
    { key: "settings", icon: <SettingOutlined />, label: t("settings") },
  ];

  const activeKey = pathname.split("/")[2] || "dashboard";

  return (
    <Sider
      width={220}
      className="border-r border-slate-100"
      style={{ background: "#fff", height: "100vh", position: "sticky", top: 0 }}
    >
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
        <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
          <BookOutlined style={{ color: "#fff", fontSize: 14 }} />
        </div>
        <span className="font-semibold text-slate-800 text-sm leading-tight">
          បណ្ណាល័យ
        </span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        className="border-none pt-2"
        style={{ borderRight: "none" }}
        onClick={({ key }) => router.push(`/${locale}/${key}`)}
      />
    </Sider>
  );
}
