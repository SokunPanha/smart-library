"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/request";

export function useSettings() {
  const { message } = App.useApp();
  const t = useTranslations("settings");
  const qc = useQueryClient();

  async function saveSettings(values: Record<string, string>) {
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(values) });
      message.success(t("savedSuccess"));
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("failedToSave"));
    }
  }

  return { saveSettings };
}
