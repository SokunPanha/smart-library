"use client";

import { useState } from "react";
import { Layout, Drawer, Grid } from "antd";
import AppSidebar, { SidebarContent } from "./AppSidebar";
import AppHeader from "./AppHeader";

const { Content } = Layout;

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  return (
    <Layout style={{ height: "100vh" }}>
      {!isMobile && <AppSidebar />}

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        width={220}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
        closable={false}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </Drawer>

      <Layout style={{ overflow: "hidden" }}>
        <AppHeader
          onMenuToggle={() => setMobileOpen(true)}
          showMenuButton={isMobile}
        />
        <Content className="p-4 lg:p-6" style={{ overflow: "hidden" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
