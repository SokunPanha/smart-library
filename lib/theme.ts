import type { ThemeConfig } from "antd";

export const minimalTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1a56db",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f8fafc",
    colorBorder: "#e2e8f0",
    colorBorderSecondary: "#f1f5f9",
    borderRadius: 6,
    borderRadiusLG: 8,
    fontFamily:
      "var(--font-noto-khmer), Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    colorTextBase: "#0f172a",
    colorTextSecondary: "#64748b",
    colorTextTertiary: "#94a3b8",
  },
  components: {
    Layout: {
      siderBg: "#ffffff",
      headerBg: "#ffffff",
      bodyBg: "#f8fafc",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "#eff6ff",
      itemSelectedColor: "#1a56db",
      itemHoverBg: "#f8fafc",
      itemBorderRadius: 6,
    },
    Card: {
      boxShadow: "none",
      boxShadowTertiary: "none",
    },
    Table: {
      headerBg: "#f8fafc",
      rowHoverBg: "#f8fafc",
      borderColor: "#e2e8f0",
    },
    Button: {
      boxShadow: "none",
      primaryShadow: "none",
    },
    Input: {
      boxShadow: "none",
      activeShadow: "none",
    },
    Select: {
      boxShadow: "none",
    },
    Modal: {
      boxShadow:
        "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
    },
    Statistic: {
      titleFontSize: 13,
    },
  },
};
