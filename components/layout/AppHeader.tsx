"use client";

import { Layout, Button, Dropdown, Avatar } from "antd";
import {
  UserOutlined,
  GlobalOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import type { MenuProps } from "antd";

const { Header } = Layout;

export default function AppHeader() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const langItems: MenuProps["items"] = [
    { key: "km", label: "ខ្មែរ", onClick: () => switchLocale("km") },
    { key: "en", label: "English", onClick: () => switchLocale("en") },
  ];

  const userItems: MenuProps["items"] = [
    { key: "logout", icon: <LogoutOutlined />, label: "Sign Out" },
  ];

  return (
    <Header
      className="flex items-center justify-between border-b border-slate-100 px-6"
      style={{
        background: "#fff",
        height: 56,
        lineHeight: "56px",
        padding: "0 24px",
      }}
    >
      <div />
      <div className="flex items-center gap-3">
        <Dropdown menu={{ items: langItems }} placement="bottomRight">
          <Button
            type="text"
            icon={<GlobalOutlined />}
            size="small"
            className="text-slate-500"
          >
            {locale === "km" ? "ខ្មែរ" : "EN"}
          </Button>
        </Dropdown>
        <Dropdown menu={{ items: userItems }} placement="bottomRight">
          <Avatar
            size={30}
            icon={<UserOutlined />}
            className="cursor-pointer bg-slate-200 text-slate-600"
          />
        </Dropdown>
      </div>
    </Header>
  );
}
