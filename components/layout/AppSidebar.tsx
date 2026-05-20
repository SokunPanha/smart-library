"use client";

import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  SettingOutlined,
  CloseOutlined,
  FieldTimeOutlined,
  HeatMapOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const { Sider } = Layout;

interface SidebarContentProps {
  onClose?: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const items = [
    { key: "dashboard", icon: <DashboardOutlined />, label: t("dashboard") },
    { key: "catalog", icon: <BookOutlined />, label: t("catalog") },
    { key: "members", icon: <TeamOutlined />, label: t("members") },
    { key: "circulation", icon: <SwapOutlined />, label: t("circulation") },
    { key: "visitor-log", icon: <FieldTimeOutlined />, label: t("visitorLog") },
    { key: "map", icon: <HeatMapOutlined />, label: t("map") },
    { key: "reports", icon: <BarChartOutlined />, label: t("reports") },
    { key: "logs", icon: <AuditOutlined />, label: t("logs") },
    { key: "settings", icon: <SettingOutlined />, label: t("settings") },
  ];

  const activeKey = pathname.split("/")[2] || "dashboard";

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <BookOutlined style={{ color: "#fff", fontSize: 14 }} />
          </div>
          <span className="font-semibold text-slate-800 text-sm leading-tight">
            បណ្ណាល័យ
          </span>
        </div>
        {onClose && (
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        className="border-none pt-2 flex-1"
        style={{ borderRight: "none" }}
        onClick={({ key }) => {
          router.push(`/${locale}/${key}`);
          onClose?.();
        }}
      />
    </div>
  );
}

export default function AppSidebar() {
  return (
    <Sider
      width={220}
      className="border-r border-slate-100"
      style={{ background: "#fff", height: "100vh", position: "sticky", top: 0 }}
    >
      <SidebarContent />
    </Sider>
  );
}
