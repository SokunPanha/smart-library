"use client";

import { Layout } from "antd";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const { Content } = Layout;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ height: "100vh" }}>
      <AppSidebar />
      <Layout style={{ overflow: "hidden" }}>
        <AppHeader />
        <Content className="p-6" style={{ overflow: "hidden" }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
